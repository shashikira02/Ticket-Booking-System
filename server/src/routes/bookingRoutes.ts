import { Router } from 'express';
import { bookSeats, bookSeatsRules, cancelBooking, getBooking, getShowSeats, listShows } from '../controllers/bookingController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/shows', listShows);
router.get('/shows/:id/seats', getShowSeats);
router.post('/bookings', requireAuth, bookSeatsRules, validate, bookSeats);
router.get('/bookings/:id', requireAuth, getBooking);
router.delete('/bookings/:id', requireAuth, cancelBooking);

export default router;
