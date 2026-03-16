import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (!connectionString && isProduction) {
  throw new Error('DATABASE_URL environment variable is required in production');
}

const pool = new Pool(
  connectionString
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'ticket_booking',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
);

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  client.release();
  console.log('Database connected successfully');
}

export default pool;
