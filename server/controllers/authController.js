import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  issueAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  signAccessToken,
  setAuthCookies,
  clearAuthCookies,
  createRefreshToken,
} from '../utils/token.js';

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 401, 'Invalid email or password');
  }

  await issueAuthTokens(res, user._id);
  sendSuccess(res, 200, 'Login successful', { user: sanitizeUser(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return sendError(res, 401, 'Refresh token not found');
  }

  const stored = await verifyRefreshToken(token);
  if (!stored) {
    clearAuthCookies(res);
    return sendError(res, 401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(stored.user);
  if (!user) {
    await revokeRefreshToken(token);
    clearAuthCookies(res);
    return sendError(res, 401, 'User not found');
  }

  // Rotate refresh token
  await revokeRefreshToken(token);
  const accessToken = signAccessToken(user._id);
  const newRefreshToken = await createRefreshToken(user._id);
  setAuthCookies(res, accessToken, newRefreshToken);

  sendSuccess(res, 200, 'Token refreshed', { user: sanitizeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }
  if (req.user) {
    await revokeAllUserTokens(req.user._id);
  }
  clearAuthCookies(res);
  sendSuccess(res, 200, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'User fetched', { user: sanitizeUser(req.user) });
});
