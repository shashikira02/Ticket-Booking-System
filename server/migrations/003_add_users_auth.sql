-- Migration: 003_add_users_auth

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

ALTER TABLE bookings ADD COLUMN user_id INT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
