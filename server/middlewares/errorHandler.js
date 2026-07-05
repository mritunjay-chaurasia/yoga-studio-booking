import { sendError } from '../utils/response.js';

const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, 'Validation failed', errors);
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format');
  }

  if (err.code === 11000) {
    return sendError(res, 409, 'Duplicate entry');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, statusCode, message);
};

export default errorHandler;
