import { Router } from 'express';
import { getInstructorSchedule } from '../controllers/instructorController.js';
import { mongoIdParamsSchema } from '../validators/schemas.js';
import { validate } from '../middlewares/validate.js';
import { authorize, instructorSelfOrAdmin } from '../middlewares/auth.js';

const router = Router();

router.get(
  '/:id/schedule',
  authorize('instructor', 'admin'),
  validate({ params: mongoIdParamsSchema('id') }),
  instructorSelfOrAdmin,
  getInstructorSchedule
);

export default router;
