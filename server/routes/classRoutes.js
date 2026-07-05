import { Router } from 'express';
import { getClasses, getClassById, createClass, updateClass, deleteClass } from '../controllers/classController.js';
import {
  createClassSchema,
  updateClassSchema,
  mongoIdParamsSchema,
  getClassesQuerySchema,
} from '../validators/schemas.js';
import { validate } from '../middlewares/validate.js';
import { authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', validate({ query: getClassesQuerySchema }), getClasses);
router.get(
  '/:id',
  validate({ params: mongoIdParamsSchema('id') }),
  getClassById
);
router.post(
  '/',
  authorize('admin'),
  validate({ body: createClassSchema }),
  createClass
);
router.put(
  '/:id',
  authorize('admin'),
  validate({ params: mongoIdParamsSchema('id'), body: updateClassSchema }),
  updateClass
);
router.delete(
  '/:id',
  authorize('admin'),
  validate({ params: mongoIdParamsSchema('id') }),
  deleteClass
);

export default router;
