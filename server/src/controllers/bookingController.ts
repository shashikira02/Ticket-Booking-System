import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import pool from '../config/db';
import logger from '../config/logger';

export const bookSeatsRules = [
  body('showId').isInt({ min: 1 }).withMessage('showId must be a positive integer'),
  body('seatNumbers').isArray({ min: 1, max: 50 }).withMessage('seatNumbers must be a non-empty array (max 50)'),
  body('seatNumbers.*').isInt({ min: 1 }).withMessage('each seat number must be a positive integer'),
];

export async function listShows(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.start_time, s.total_seats,
              COUNT(se.id) FILTER (WHERE se.is_booked = FALSE) AS available_seats
       FROM shows s
       LEFT JOIN seats se ON se.show_id = s.id
       GROUP BY s.id
       ORDER BY s.start_time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getShowSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const show = await pool.query<{ total_seats: number }>(
      'SELECT total_seats FROM shows WHERE id = $1',
      [id]
    );
    if (show.rows.length === 0) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    // Single query — DB does the grouping, no JS filtering needed
    const result = await pool.query<{ available: number[]; booked: number[] }>(
      `SELECT
         array_agg(seat_number ORDER BY seat_number) FILTER (WHERE is_booked = FALSE) AS available,
         array_agg(seat_number ORDER BY seat_number) FILTER (WHERE is_booked = TRUE)  AS booked
       FROM seats WHERE show_id = $1`,
      [id]
    );

    const row = result.rows[0];
    const available = row?.available ?? [];
    const booked = row?.booked ?? [];

    res.json({
      showId: Number(id),
      totalSeats: show.rows[0]?.total_seats,
      availableCount: available.length,
      bookedCount: booked.length,
      availableSeats: available,
      bookedSeats: booked,
    });
  } catch (err) {
    next(err);
  }
}

export async function bookSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { showId, seatNumbers } = req.body as { showId: number; seatNumbers: number[] };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: number; is_booked: boolean }>(
      `SELECT id, is_booked FROM seats
       WHERE show_id = $1 AND seat_number = ANY($2)
       FOR UPDATE`,
      [showId, seatNumbers]
    );

    if (rows.length !== seatNumbers.length) {
      await client.query('ROLLBACK');
      res.status(404).json({ status: 'FAILED', message: 'One or more seat numbers not found for this show.' });
      return;
    }

    if (rows.some((r) => r.is_booked)) {
      await client.query('ROLLBACK');
      res.status(409).json({ status: 'FAILED', message: 'One or more seats already booked.' });
      return;
    }

    const seatIds = rows.map((r) => r.id);

    await client.query('UPDATE seats SET is_booked = TRUE WHERE id = ANY($1)', [seatIds]);

    const insert = await client.query<{ id: number }>(
      "INSERT INTO bookings (show_id, status, user_id) VALUES ($1, $2, $3) RETURNING id",
      [showId, 'pending', req.user?.userId]
    );
    const bookingId = insert.rows[0]?.id;

    // Bulk insert booking_seats using parameterized query
    const bsParams: number[] = [];
    const bsPlaceholders = seatIds.map((seatId) => {
      bsParams.push(bookingId!, seatId);
      return `($${bsParams.length - 1}, $${bsParams.length})`;
    }).join(', ');
    await client.query(`INSERT INTO booking_seats (booking_id, seat_id) VALUES ${bsPlaceholders}`, bsParams);

    await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);

    await client.query('COMMIT');
    logger.info({ bookingId: Number(bookingId), showId: Number(showId), seatCount: seatIds.length }, 'Booking confirmed');
    res.status(201).json({ status: 'CONFIRMED', bookingId });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.id, b.show_id, b.status, b.created_at,
              array_agg(s.seat_number ORDER BY s.seat_number) AS seat_numbers
       FROM bookings b
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats s ON s.id = bs.seat_id
       WHERE b.id = $1
       GROUP BY b.id`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const booking = result.rows[0] as { user_id: number };
    if (booking.user_id !== req.user?.userId) {
      res.status(403).json({ error: 'You can only view your own bookings' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const booking = await client.query<{ status: string; user_id: number }>(
      'SELECT status, user_id FROM bookings WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (booking.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.rows[0]?.user_id !== req.user?.userId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'You can only cancel your own bookings' });
      return;
    }

    if (booking.rows[0]?.status === 'cancelled') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Booking already cancelled' });
      return;
    }

    await client.query(
      `UPDATE seats SET is_booked = FALSE
       WHERE id IN (SELECT seat_id FROM booking_seats WHERE booking_id = $1)`,
      [id]
    );
    await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [id]);

    await client.query('COMMIT');
    logger.info({ bookingId: Number(id) }, 'Booking cancelled');
    res.json({ status: 'CANCELLED', bookingId: Number(id) });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
