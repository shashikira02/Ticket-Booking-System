-- Migration: 001_initial_schema

CREATE TABLE shows (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  start_time  TIMESTAMP   NOT NULL,
  total_seats INT         NOT NULL
);

CREATE TABLE seats (
  id          SERIAL      PRIMARY KEY,
  show_id     INT         NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_number INT         NOT NULL,
  is_booked   BOOL        NOT NULL DEFAULT FALSE,
  UNIQUE (show_id, seat_number)
);

CREATE INDEX idx_seats_show_id ON seats(show_id);

CREATE TABLE bookings (
  id         SERIAL PRIMARY KEY,
  show_id    INT          NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  status     VARCHAR(10)  NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_show_id ON bookings(show_id);

CREATE TABLE booking_seats (
  booking_id  INT  NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id     INT  NOT NULL REFERENCES seats(id)    ON DELETE CASCADE,
  PRIMARY KEY (booking_id, seat_id)
);

CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id    ON booking_seats(seat_id);
