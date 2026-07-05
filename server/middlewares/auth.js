import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { verifyAccessToken } from '../utils/token.js';

const getAccessToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

export const protect = async (req, res, next) => {
  const token = getAccessToken(req);

  if (!token) {
    return sendError(res, 401, 'Not authorized — please log in');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return sendError(res, 401, 'User not found');
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Access token expired');
    }
    return sendError(res, 401, 'Invalid or expired token');
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, 'Access denied — insufficient permissions');
  }
  next();
};

export const selfOrAdmin =
  (paramKey = 'id') =>
  (req, res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.params[paramKey] === req.user._id.toString()) return next();
    return sendError(res, 403, 'Access denied');
  };

export const instructorSelfOrAdmin = selfOrAdmin('id');
export const studentSelfOrAdmin = selfOrAdmin('id');

export const ownBookingOrAdmin = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return sendError(res, 404, 'Booking not found');
  }
  if (booking.student.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Access denied');
  }
  req.booking = booking;
  next();
};

const PUBLIC_ROUTES = [
  { method: 'GET', match: (path) => path === '/health' },
  { method: 'POST', match: (path) => path === '/auth/login' },
  { method: 'POST', match: (path) => path === '/auth/refresh' },
  { method: 'POST', match: (path) => path === '/auth/logout' },
  {
    method: 'GET',
    match: (path) => path === '/classes' || /^\/classes\/[^/]+$/.test(path),
  },
];

export const authenticateUnlessPublic = (req, res, next) => {
  const isPublic = PUBLIC_ROUTES.some(
    (route) => route.method === req.method && route.match(req.path)
  );
  if (isPublic) return next();
  return protect(req, res, next);
};
