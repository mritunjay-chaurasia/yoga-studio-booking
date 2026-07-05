import { Router } from 'express';
import { login, getMe, refresh, logout } from '../controllers/authController.js';
import { loginSchema } from '../validators/schemas.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
