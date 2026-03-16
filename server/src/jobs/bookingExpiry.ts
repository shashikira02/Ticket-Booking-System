import pool from '../config/db';
import logger from '../config/logger';

const EXPIRY_MINUTES = 2;
const INTERVAL_MS = 30_000;

async function expireStaleBookings(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: number }>(
      `SELECT id FROM bookings
       WHERE status = 'pending'
         AND created_at < NOW() - ($1 * INTERVAL '1 minute')
       FOR UPDATE SKIP LOCKED`,
      [EXPIRY_MINUTES]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return;
    }

    const ids = rows.map((r) => r.id);

    await client.query(
      `UPDATE seats SET is_booked = FALSE
       WHERE id IN (SELECT seat_id FROM booking_seats WHERE booking_id = ANY($1))`,
      [ids]
    );

    await client.query(`UPDATE bookings SET status = 'failed' WHERE id = ANY($1)`, [ids]);

    await client.query('COMMIT');
    logger.info({ expiredCount: ids.length }, 'Expired stale bookings');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(err, 'Error in booking expiry job');
  } finally {
    client.release();
  }
}

export function startExpiryJob(): void {
  logger.info('Booking expiry job started');
  setInterval(() => {
    expireStaleBookings().catch((err: Error) =>
      logger.error(err, 'Unhandled error in expiry job')
    );
  }, INTERVAL_MS);
}
