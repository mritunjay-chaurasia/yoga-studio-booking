import Joi from 'joi';
import { getClassDateTime, startOfToday } from '../utils/classHelpers.js';

export const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

const roleEnum = Joi.string().valid('admin', 'instructor', 'student');

export const getUsersQuerySchema = Joi.object({
  role: roleEnum,
});

export const getClassesQuerySchema = Joi.object({
  instructor: objectId,
  search: Joi.string().trim().max(100),
  date: Joi.date().iso(),
  upcoming: Joi.string().valid('true', 'false'),
  studioId: Joi.string().trim().max(50).default('default'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Valid email is required',
    'any.required': 'Email is required',
  }),
  phone: Joi.string().trim().min(7).max(15).pattern(/^[0-9+\-\s()]+$/).required().messages({
    'string.empty': 'Phone is required',
    'string.pattern.base': 'Phone must contain only digits and valid symbols',
    'any.required': 'Phone is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  role: roleEnum.required().messages({
    'any.only': 'Invalid role',
    'any.required': 'Role is required',
  }),
});

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateClassSchedule = (value, helpers, { requireFutureStart = false } = {}) => {
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    return helpers.error('any.custom', { message: 'End time must be after start time' });
  }

  if (!value.date || !value.startTime) return value;

  const classDay = new Date(value.date);
  classDay.setHours(0, 0, 0, 0);
  const today = startOfToday();

  if (classDay < today) {
    return helpers.error('any.custom', { message: 'Date must be today or in the future' });
  }

  if (requireFutureStart) {
    const classStart = getClassDateTime(value, 'startTime');
    if (classStart <= new Date()) {
      return helpers.error('any.custom', {
        message: 'Class start time must be in the future',
      });
    }
  }

  return value;
};

export const createClassSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must be at most 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description must be at most 1000 characters',
    'any.required': 'Description is required',
  }),
  instructor: objectId.required().messages({
    'any.required': 'Valid instructor ID is required',
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Valid date is required',
    'any.required': 'Date is required',
  }),
  startTime: Joi.string().trim().pattern(timePattern).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM format',
    'any.required': 'Start time is required',
  }),
  endTime: Joi.string().trim().pattern(timePattern).required().messages({
    'string.pattern.base': 'End time must be in HH:MM format',
    'any.required': 'End time is required',
  }),
  capacity: Joi.number().integer().min(1).max(500).required().messages({
    'number.min': 'Capacity must be at least 1',
    'number.max': 'Capacity must be at most 500',
    'any.required': 'Capacity is required',
  }),
}).custom((value, helpers) => validateClassSchedule(value, helpers, { requireFutureStart: true }));

export const updateClassSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100),
  description: Joi.string().trim().min(1).max(1000),
  instructor: objectId,
  date: Joi.date().iso(),
  startTime: Joi.string().trim().pattern(timePattern),
  endTime: Joi.string().trim().pattern(timePattern),
  capacity: Joi.number().integer().min(1).max(500),
}).min(1).custom((value, helpers) => validateClassSchedule(value, helpers));

export const createBookingSchema = Joi.object({
  yogaClass: objectId.required().messages({
    'any.required': 'Valid class ID is required',
  }),
});

export const mongoIdParamsSchema = (paramName = 'id') =>
  Joi.object({
    [paramName]: objectId.required(),
  });
