import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import classRoutes from './classRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import instructorRoutes from './instructorRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import { authenticateUnlessPublic } from '../middlewares/auth.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Yoga Studio API is running' });
});

router.use(authenticateUnlessPublic);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/bookings', bookingRoutes);
router.use('/instructors', instructorRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
