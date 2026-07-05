import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getUsers = asyncHandler(async (req, res) => {
  const filter = { studioId: req.user.studioId };
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).select('-password').sort({ name: 1 });
  sendSuccess(res, 200, 'Users fetched', { users });
});

export const createUser = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    return sendError(res, 409, 'Email already registered');
  }

  const user = await User.create({
    ...req.body,
    studioId: req.user.studioId,
  });
  const userObj = user.toObject();
  delete userObj.password;
  sendSuccess(res, 201, 'User created', { user: userObj });
});
