import { Router } from 'express';
import {
  createBooking,
  cancelBooking,
  getStudentBookings,
  getClassBookings,
} from '../controllers/bookingController.js';
import {
  createBookingSchema,
  mongoIdParamsSchema,
} from '../validators/schemas.js';
import { validate } from '../middlewares/validate.js';
import {
  authorize,
  ownBookingOrAdmin,
  studentSelfOrAdmin,
} from '../middlewares/auth.js';

const router = Router();

router.post(
  '/',
  authorize('student'),
  validate({ body: createBookingSchema }),
  createBooking
);
router.delete(
  '/:id',
  authorize('student', 'admin'),
  validate({ params: mongoIdParamsSchema('id') }),
  ownBookingOrAdmin,
  cancelBooking
);
router.get(
  '/student/:id',
  authorize('student', 'admin'),
  validate({ params: mongoIdParamsSchema('id') }),
  studentSelfOrAdmin,
  getStudentBookings
);
router.get(
  '/class/:id',
  authorize('admin', 'instructor'),
  validate({ params: mongoIdParamsSchema('id') }),
  getClassBookings
);

export default router;
