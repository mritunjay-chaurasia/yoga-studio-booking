import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authorize('admin'), getDashboard);

export default router;
