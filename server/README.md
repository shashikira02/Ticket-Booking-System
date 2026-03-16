# Ticket Booking System — Backend

A production-ready REST API for a ticket booking system built with **Node.js**, **Express.js**, **TypeScript**, and **PostgreSQL**. Simulates core functionality of platforms like BookMyShow or RedBus. Handles high-concurrency seat booking with PostgreSQL row-level locking to prevent race conditions and overbooking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 5 |
| Language | TypeScript 5 |
| Database | PostgreSQL 18 |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Logging | Pino |
| Validation | express-validator |
| Security | Helmet, CORS |
| Migrations | node-pg-migrate |
| API Docs | Swagger UI (OpenAPI 3.0) |

---

## Project Structure

```
server/
├── migrations/
│   ├── 001_initial_schema.sql     # shows, seats, bookings, booking_seats
│   ├── 002_add_failed_status.sql  # adds 'failed' to booking status
│   └── 003_add_users_auth.sql     # users table + user_id on bookings
├── src/
│   ├── config/
│   │   ├── config.ts              # typed env config
│   │   ├── db.ts                  # pg Pool with SSRF protection
│   │   ├── logger.ts              # Pino logger
│   │   └── swagger.ts             # OpenAPI spec
│   ├── controllers/
│   │   ├── adminController.ts     # show management
│   │   ├── authController.ts      # register, login
│   │   └── bookingController.ts   # booking operations
│   ├── jobs/
│   │   └── bookingExpiry.ts       # auto-expire pending bookings
│   ├── middleware/
│   │   ├── auth.ts                # requireAuth, requireAdmin
│   │   └── validate.ts            # express-validator error handler
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   └── bookingRoutes.ts
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Entry point
├── .env
├── package.json
├── tsconfig.json
├── README.md
└── SYSTEM_DESIGN.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 18 running locally
- npm

### 1. Clone and install dependencies

```bash
git clone https://github.com/shashikira02/Ticket-Booking-System
cd server
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `server/` directory:

```env
PORT=8080
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_booking
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>

DATABASE_URL=postgres://<your_db_user>:<your_db_password>@localhost:5432/ticket_booking
ALLOWED_DB_HOSTS=localhost,127.0.0.1

JWT_SECRET=<your_long_random_secret>
ALLOWED_ORIGIN=http://localhost:3000
```

### 3. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE ticket_booking;"
```

### 4. Run all migrations

```bash
cd server
npm run migrate
```

This creates the following tables: `users`, `shows`, `seats`, `bookings`, `booking_seats`

### 5. Start the server

```bash
# Development — hot reload
npm run dev

# Production
npm run build
npm start
```

Server runs at: `http://localhost:8080`

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon + ts-node |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run migrate` | Run all pending DB migrations |
| `npm run migrate:down` | Rollback the last migration |

---

## API Documentation (Swagger UI)

Interactive docs available at:
```
http://localhost:8080/api/docs
```

---

## API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
Protected routes require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```
Get a token by registering or logging in.

---

## Auth Endpoints

### `POST /auth/register` — Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "<your_password>",
  "role": "user"
}
```
> `role` can be `"user"` or `"admin"`. Defaults to `"user"` if omitted.

**Response `201`:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Error responses:**
| Code | Reason |
|---|---|
| `400` | Validation error (invalid email, short password) |
| `409` | Email already registered |

---

### `POST /auth/login` — Login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "<your_password>"
}
```

**Response `200`:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Error responses:**
| Code | Reason |
|---|---|
| `400` | Validation error |
| `401` | Invalid email or password |

---

## Admin Endpoints
> All admin routes require `Authorization: Bearer <ADMIN_TOKEN>`

### `POST /admin/shows` — Create a show

**Request:**
```json
{
  "name": "Concert Night",
  "startTime": "2025-12-01T19:00:00",
  "totalSeats": 40
}
```

**Response `201`:**
```json
{ "id": 1, "name": "Concert Night", "totalSeats": 40 }
```

**Error responses:**
| Code | Reason |
|---|---|
| `400` | Validation error |
| `401` | Missing or invalid token |
| `403` | Not an admin |

---

### `GET /admin/shows` — List all shows (admin)

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Concert Night",
    "start_time": "2025-12-01T19:00:00.000Z",
    "total_seats": 40,
    "available_seats": "37"
  }
]
```

---

### `GET /admin/shows/:id` — Get a single show (admin)

**Response `200`:** Same shape as above for one show.

**Error responses:**
| Code | Reason |
|---|---|
| `404` | Show not found |

---

## User / Public Endpoints

### `GET /shows` — List all shows (public, no auth required)

**Response `200`:** Same shape as `GET /admin/shows`.

---

### `GET /shows/:id/seats` — Get seat availability (public)

**Response `200`:**
```json
{
  "showId": 1,
  "totalSeats": 40,
  "availableCount": 37,
  "bookedCount": 3,
  "availableSeats": [4, 5, 6, 7],
  "bookedSeats": [1, 2, 3]
}
```

**Error responses:**
| Code | Reason |
|---|---|
| `404` | Show not found |

---

## Booking Endpoints
> All booking routes require `Authorization: Bearer <USER_TOKEN>`

### `POST /bookings` — Book seats

**Request:**
```json
{
  "showId": 1,
  "seatNumbers": [1, 2, 3]
}
```

**Response `201`:**
```json
{ "status": "CONFIRMED", "bookingId": 1 }
```

**Error responses:**
| Code | Reason |
|---|---|
| `400` | Validation error |
| `401` | Not authenticated |
| `404` | Seat numbers not found for this show |
| `409` | One or more seats already booked |

---

### `GET /bookings/:id` — Get booking details (owner only)

**Response `200`:**
```json
{
  "id": 1,
  "show_id": 1,
  "status": "confirmed",
  "created_at": "2025-01-01T10:00:00.000Z",
  "seat_numbers": [1, 2, 3]
}
```

**Error responses:**
| Code | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Not your booking |
| `404` | Booking not found |

---

### `DELETE /bookings/:id` — Cancel a booking (owner only)

**Response `200`:**
```json
{ "status": "CANCELLED", "bookingId": 1 }
```

**Error responses:**
| Code | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Not your booking |
| `404` | Booking not found |
| `409` | Booking already cancelled |

---

## Booking Status Flow

```
POST /bookings
      │
      ▼
  [PENDING] ─── expiry job fires after 2 min ───▶ [FAILED]
      │                                            (seats freed)
  seats linked + status updated
      │
      ▼
  [CONFIRMED]
      │
  DELETE /bookings/:id
      │
      ▼
  [CANCELLED]
  (seats freed back to available)
```

---

## Access Control Summary

| Route | Access |
|---|---|
| `POST /auth/register` | Public |
| `POST /auth/login` | Public |
| `GET /shows` | Public |
| `GET /shows/:id/seats` | Public |
| `POST /admin/shows` | Admin only |
| `GET /admin/shows` | Admin only |
| `GET /admin/shows/:id` | Admin only |
| `POST /bookings` | Authenticated users |
| `GET /bookings/:id` | Owner only |
| `DELETE /bookings/:id` | Owner only |

---

## Concurrency Strategy

Seat booking uses **PostgreSQL row-level locking** (`SELECT FOR UPDATE`) inside a transaction:

```sql
BEGIN;

-- Lock the exact seat rows — concurrent requests queue here
SELECT id, is_booked FROM seats
  WHERE show_id = $1 AND seat_number = ANY($2)
  FOR UPDATE;

-- If any seat is already booked → ROLLBACK → return 409
-- Otherwise:
UPDATE seats SET is_booked = TRUE WHERE id = ANY($1);
INSERT INTO bookings (show_id, status, user_id) VALUES ($1, 'pending', $2) RETURNING id;
INSERT INTO booking_seats (booking_id, seat_id) VALUES ...;
UPDATE bookings SET status = 'confirmed' WHERE id = $1;

COMMIT;
```

Only one transaction can hold the lock at a time. Concurrent requests for the same seats wait, then fail with `409` if seats were taken.

---

## Booking Expiry Job

A background job runs every **30 seconds** and automatically marks any `pending` booking older than **2 minutes** as `failed`, freeing the seats back to available.

Uses `FOR UPDATE SKIP LOCKED` — safe to run across multiple server instances without double-processing.
