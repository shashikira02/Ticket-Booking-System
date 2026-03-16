import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Booking API',
      version: '1.0.0',
      description: 'REST API for a ticket booking system with concurrency-safe seat reservations',
    },
    servers: [{ url: 'http://localhost:8080/api/v1' }],
    tags: [
      { name: 'Admin', description: 'Show management (admin only)' },
      { name: 'Shows', description: 'Public show and seat listing' },
      { name: 'Bookings', description: 'Seat booking operations' },
    ],
    components: {
      schemas: {
        Show: {
          type: 'object',
          properties: {
            id:               { type: 'integer', example: 1 },
            name:             { type: 'string',  example: 'Concert Night' },
            start_time:       { type: 'string',  format: 'date-time', example: '2025-12-01T19:00:00.000Z' },
            total_seats:      { type: 'integer', example: 40 },
            available_seats:  { type: 'integer', example: 35 },
          },
        },
        ShowSeats: {
          type: 'object',
          properties: {
            showId:         { type: 'integer', example: 1 },
            totalSeats:     { type: 'integer', example: 40 },
            availableCount: { type: 'integer', example: 37 },
            bookedCount:    { type: 'integer', example: 3 },
            availableSeats: { type: 'array', items: { type: 'integer' }, example: [4, 5, 6] },
            bookedSeats:    { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 1 },
            show_id:      { type: 'integer', example: 1 },
            status:       { type: 'string',  enum: ['pending', 'confirmed', 'cancelled', 'failed'], example: 'confirmed' },
            created_at:   { type: 'string',  format: 'date-time' },
            seat_numbers: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Show not found' },
          },
        },
      },
    },
    paths: {
      '/admin/shows': {
        post: {
          tags: ['Admin'],
          summary: 'Create a new show',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'startTime', 'totalSeats'],
                  properties: {
                    name:       { type: 'string',  example: 'Concert Night' },
                    startTime:  { type: 'string',  format: 'date-time', example: '2025-12-01T19:00:00' },
                    totalSeats: { type: 'integer', example: 40 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Show created', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, totalSeats: { type: 'integer' } } } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        get: {
          tags: ['Admin'],
          summary: 'List all shows (admin)',
          responses: {
            200: { description: 'List of shows', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Show' } } } } },
          },
        },
      },
      '/admin/shows/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get a single show by ID (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Show details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Show' } } } },
            404: { description: 'Show not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/shows': {
        get: {
          tags: ['Shows'],
          summary: 'List all available shows (public)',
          responses: {
            200: { description: 'List of shows with available seat count', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Show' } } } } },
          },
        },
      },
      '/shows/{id}/seats': {
        get: {
          tags: ['Shows'],
          summary: 'Get seat availability for a show',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Seat availability breakdown', content: { 'application/json': { schema: { $ref: '#/components/schemas/ShowSeats' } } } },
            404: { description: 'Show not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/bookings': {
        post: {
          tags: ['Bookings'],
          summary: 'Book seats for a show',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['showId', 'seatNumbers'],
                  properties: {
                    showId:      { type: 'integer', example: 1 },
                    seatNumbers: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Booking confirmed', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'CONFIRMED' }, bookingId: { type: 'integer', example: 1 } } } } } },
            400: { description: 'Validation error' },
            404: { description: 'Seat numbers not found for this show' },
            409: { description: 'One or more seats already booked', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'FAILED' }, message: { type: 'string' } } } } } },
          },
        },
      },
      '/bookings/{id}': {
        get: {
          tags: ['Bookings'],
          summary: 'Get booking details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Booking details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
            404: { description: 'Booking not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Bookings'],
          summary: 'Cancel a booking',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Booking cancelled', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'CANCELLED' }, bookingId: { type: 'integer' } } } } } },
            404: { description: 'Booking not found' },
            409: { description: 'Booking already cancelled' },
          },
        },
      },
    },
  },
  apis: [],
};

export default swaggerJsdoc(options);
