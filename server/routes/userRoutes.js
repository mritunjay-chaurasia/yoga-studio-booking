import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController.js';
import { createUserSchema, getUsersQuerySchema } from '../validators/schemas.js';
import { validate } from '../middlewares/validate.js';
import { authorize } from '../middlewares/auth.js';

const router = Router();

router.get(
  '/',
  authorize('admin'),
  validate({ query: getUsersQuerySchema }),
  getUsers
);
router.post(
  '/',
  authorize('admin'),
  validate({ body: createUserSchema }),
  createUser
);

export default router;
