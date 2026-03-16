# System Design — Ticket Booking System at Scale

## 1. High-Level Architecture

```
                        ┌─────────────────────────────────────┐
                        │           Load Balancer              │
                        │         (AWS ALB / Nginx)            │
                        └──────────────┬──────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
     ┌────────▼───────┐      ┌────────▼───────┐      ┌────────▼───────┐
     │  API Server 1  │      │  API Server 2  │      │  API Server N  │
     │ Node/Express   │      │ Node/Express   │      │ Node/Express   │
     └────────┬───────┘      └────────┬───────┘      └────────┬───────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
     ┌────────▼───────┐      ┌────────▼───────┐      ┌────────▼───────┐
     │  Redis Cache   │      │  PostgreSQL     │      │  Message Queue │
     │  (Seat state)  │      │  Primary + RR   │      │  (RabbitMQ /   │
     │                │      │  Read Replicas  │      │   AWS SQS)     │
     └────────────────┘      └────────────────┘      └────────────────┘
```

---

## 2. Database Design and Scaling

### Current Schema

```
shows         → id, name, start_time, total_seats
seats         → id, show_id (FK), seat_number, is_booked
bookings      → id, show_id (FK), status, created_at
booking_seats → booking_id (FK), seat_id (FK)
```

### Scaling Strategy

#### Read Replicas
- Route all `SELECT` queries (list shows, get seats) to **read replicas**
- Route all writes (INSERT, UPDATE) to the **primary** node
- Use `pg` connection pools pointed at separate hosts per operation type

#### Partitioning
- Partition `seats` and `bookings` by `show_id` using PostgreSQL range/hash partitioning
- Each show's data lives in its own partition — queries never scan unrelated rows

#### Sharding (at extreme scale)
- Shard by `show_id` across multiple PostgreSQL instances
- All seats and bookings for a show live on the same shard — no cross-shard joins needed
- Use a routing layer (e.g. Citus or application-level) to direct queries to the correct shard

#### Indexes (already applied)
```sql
idx_seats_show_id
idx_bookings_show_id
idx_booking_seats_booking_id
idx_booking_seats_seat_id
```

---

## 3. Concurrency Control

### Current Implementation — Pessimistic Locking

```sql
BEGIN;
SELECT id, is_booked FROM seats
  WHERE show_id = $1 AND seat_number = ANY($2)
  FOR UPDATE;   -- row-level lock
-- verify not booked
UPDATE seats SET is_booked = TRUE ...
COMMIT;
```

`SELECT FOR UPDATE` locks the exact seat rows. Concurrent transactions queue at the lock — only one proceeds, others wait and then receive a `409 FAILED` if seats are taken.

### At Scale — Optimistic Locking Alternative

For very high throughput, switch to **optimistic locking** with a `version` column:

```sql
-- Read with version
SELECT id, is_booked, version FROM seats WHERE ...

-- Update only if version hasn't changed
UPDATE seats SET is_booked = TRUE, version = version + 1
  WHERE id = $1 AND version = $2 AND is_booked = FALSE;

-- If 0 rows updated → conflict → retry or fail
```

This avoids holding locks and scales better under high read:write ratios.

### Queue-Based Serialization (highest scale)

For peak events (e.g. popular concert goes on sale):
- Accept booking requests into a **Redis queue** or **SQS FIFO queue** per show
- A single worker per show processes bookings sequentially — no DB-level contention at all
- Respond to users asynchronously via WebSocket or polling

---

## 4. Caching Strategy

### What to Cache

| Data | Cache | TTL |
|---|---|---|
| Show listings | Redis | 30 seconds |
| Seat availability count | Redis | 5 seconds |
| Individual show details | Redis | 60 seconds |

### What NOT to Cache
- Exact seat availability per seat (changes too fast under concurrency)
- Booking status (must always be fresh from DB)

### Implementation

```typescript
// Pseudo-code for cached show listing
async function listShows() {
  const cached = await redis.get('shows:all');
  if (cached) return JSON.parse(cached);

  const result = await pool.query('SELECT ...');
  await redis.setex('shows:all', 30, JSON.stringify(result.rows));
  return result.rows;
}

// Invalidate on show create
async function createShow(...) {
  // ... insert ...
  await redis.del('shows:all');
}
```

### Cache Invalidation
- On `POST /admin/shows` → invalidate `shows:all`
- On `POST /bookings` → invalidate `shows:{id}:seats`
- On `DELETE /bookings/:id` → invalidate `shows:{id}:seats`

---

## 5. Message Queue Usage

### Booking Confirmation Flow (Decoupled)

Instead of sending confirmation emails/SMS synchronously in the booking handler:

```
POST /bookings
     │
     ▼
[DB Transaction] ── CONFIRMED ──▶ [Publish to Queue: booking.confirmed]
     │                                        │
     ▼                                        ▼
Return 201 immediately              [Consumer Service]
                                    - Send confirmation email
                                    - Send SMS
                                    - Update analytics
```

### Booking Expiry (Current vs Queue-Based)

Current: `setInterval` polling every 30s — works for single instance.

At scale: Publish a **delayed message** to SQS/RabbitMQ with a 2-minute delay when a booking is created. The consumer marks it failed if still pending — no polling needed, works across multiple instances.

```
POST /bookings → INSERT pending → publish delayed msg (2 min TTL)
                                          │
                                    [2 min later]
                                          │
                                          ▼
                                  Consumer checks status
                                  if still pending → mark FAILED
```

---

## 6. Additional Production Considerations

### Rate Limiting
- Apply per-IP rate limiting on `POST /bookings` (e.g. 10 requests/minute) using `express-rate-limit` + Redis store
- Prevents a single user from flooding the booking queue

### API Gateway
- Use AWS API Gateway or Kong in front of the Node servers
- Handles auth, rate limiting, SSL termination, and request routing centrally

### Observability
- Structured JSON logs (Pino) → shipped to CloudWatch / Datadog
- Metrics: booking success rate, seat lock wait time, expiry job lag
- Distributed tracing with OpenTelemetry for cross-service request tracking

### Horizontal Scaling
- Node.js servers are stateless — scale horizontally behind the load balancer freely
- Session/state lives in Redis and PostgreSQL, not in-process
- Expiry job uses `FOR UPDATE SKIP LOCKED` — safe to run on multiple instances simultaneously without double-processing
