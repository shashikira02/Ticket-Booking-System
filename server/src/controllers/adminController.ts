import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import pool from '../config/db';
import logger from '../config/logger';

export const createShowRules = [
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('startTime').isISO8601().withMessage('startTime must be a valid ISO8601 date'),
  body('totalSeats').isInt({ min: 1, max: 1000 }).withMessage('totalSeats must be between 1 and 1000'),
];

export async function createShow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, startTime, totalSeats } = req.body as {
      name: string;
      startTime: string;
      totalSeats: number;
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const showResult = await client.query<{ id: number }>(
        'INSERT INTO shows (name, start_time, total_seats) VALUES ($1, $2, $3) RETURNING id',
        [name, startTime, totalSeats]
      );
      const showId = showResult.rows[0]?.id;

      const params: (number)[] = [];
      const placeholders = Array.from({ length: totalSeats }, (_, i) => {
        params.push(showId!, i + 1);
        return `($${params.length - 1}, $${params.length})`;
      }).join(', ');
      await client.query(`INSERT INTO seats (show_id, seat_number) VALUES ${placeholders}`, params);

      await client.query('COMMIT');
      logger.info({ showId: Number(showId), totalSeats: Number(totalSeats) }, 'Show created');
      res.status(201).json({ id: showId, name, totalSeats });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export async function getShows(_req: Request, res: Response, next: NextFunction): Promise<void> {
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

export async function getShow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.name, s.start_time, s.total_seats,
              COUNT(se.id) FILTER (WHERE se.is_booked = FALSE) AS available_seats
       FROM shows s
       LEFT JOIN seats se ON se.show_id = s.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
