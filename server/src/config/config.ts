import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port:    number;
  nodeEnv: string;
  db: {
    host:     string;
    port:     number;
    name:     string;
    user:     string;
    password: string;
  };
}

const config: Config = {
  port:    Number(process.env.PORT)    || 3000,
  nodeEnv: process.env.NODE_ENV        || 'development',
  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 5432,
    name:     process.env.DB_NAME     || 'ticket_booking',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
};

export default config;
