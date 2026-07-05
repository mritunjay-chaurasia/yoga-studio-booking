import YogaClass from '../models/YogaClass.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  enrichClassesWithSeats,
  enrichClassWithSeats,
  getBookingCounts,
  startOfToday,
  hasInstructorConflict,
} from '../utils/classHelpers.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const PUBLIC_INSTRUCTOR_FIELDS = 'name';
const AUTH_INSTRUCTOR_FIELDS = 'name email phone role';

export const getClasses = asyncHandler(async (req, res) => {
  const { instructor, search, date, upcoming, page, limit, studioId } = req.query;

  const filter = { studioId: studioId || 'default' };
  if (upcoming !== 'false') {
    filter.date = { $gte: startOfToday() };
  }
  if (instructor) filter.instructor = instructor;
  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
  }
  if (date) {
    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: day, $lt: nextDay };
  }

  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    YogaClass.find(filter)
      .populate('instructor', PUBLIC_INSTRUCTOR_FIELDS)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit),
    YogaClass.countDocuments(filter),
  ]);

  const enriched = await enrichClassesWithSeats(classes);
  sendSuccess(res, 200, 'Classes fetched', {
    classes: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getClassById = asyncHandler(async (req, res) => {
  const yogaClass = await YogaClass.findById(req.params.id).populate(
    'instructor',
    PUBLIC_INSTRUCTOR_FIELDS
  );
  if (!yogaClass) {
    return sendError(res, 404, 'Class not found');
  }
  const counts = await getBookingCounts([yogaClass._id]);
  sendSuccess(res, 200, 'Class fetched', {
    yogaClass: enrichClassWithSeats(yogaClass, counts),
  });
});

export const createClass = asyncHandler(async (req, res) => {
  const instructor = await User.findById(req.body.instructor);
  if (!instructor || instructor.role !== 'instructor') {
    return sendError(res, 400, 'Invalid instructor');
  }
  if (instructor.studioId !== req.user.studioId) {
    return sendError(res, 400, 'Instructor belongs to another studio');
  }

  const conflict = await hasInstructorConflict(
    req.body.instructor,
    req.body.date,
    req.body.startTime,
    req.body.endTime
  );
  if (conflict) {
    return sendError(res, 409, 'Instructor already has a class at this time');
  }

  const yogaClass = await YogaClass.create({
    ...req.body,
    studioId: req.user.studioId,
  });
  await yogaClass.populate('instructor', AUTH_INSTRUCTOR_FIELDS);
  sendSuccess(res, 201, 'Class created', {
    yogaClass: enrichClassWithSeats(yogaClass, {}),
  });
});

export const updateClass = asyncHandler(async (req, res) => {
  const existing = await YogaClass.findById(req.params.id);
  if (!existing) {
    return sendError(res, 404, 'Class not found');
  }
  if (existing.studioId !== req.user.studioId) {
    return sendError(res, 403, 'Access denied');
  }

  if (req.body.capacity !== undefined) {
    const booked = await Booking.countDocuments({ yogaClass: existing._id });
    if (req.body.capacity < booked) {
      return sendError(
        res,
        400,
        `Capacity cannot be less than current bookings (${booked})`
      );
    }
  }

  const instructorId = req.body.instructor || existing.instructor;
  const date = req.body.date || existing.date;
  const startTime = req.body.startTime || existing.startTime;
  const endTime = req.body.endTime || existing.endTime;

  if (req.body.instructor) {
    const instructor = await User.findById(req.body.instructor);
    if (!instructor || instructor.role !== 'instructor') {
      return sendError(res, 400, 'Invalid instructor');
    }
  }

  const conflict = await hasInstructorConflict(
    instructorId,
    date,
    startTime,
    endTime,
    existing._id
  );
  if (conflict) {
    return sendError(res, 409, 'Instructor already has a class at this time');
  }

  const yogaClass = await YogaClass.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('instructor', AUTH_INSTRUCTOR_FIELDS);

  const counts = await getBookingCounts([yogaClass._id]);
  sendSuccess(res, 200, 'Class updated', {
    yogaClass: enrichClassWithSeats(yogaClass, counts),
  });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const yogaClass = await YogaClass.findById(req.params.id);
  if (!yogaClass) {
    return sendError(res, 404, 'Class not found');
  }
  if (yogaClass.studioId !== req.user.studioId) {
    return sendError(res, 403, 'Access denied');
  }
  await Booking.deleteMany({ yogaClass: req.params.id });
  await yogaClass.deleteOne();
  sendSuccess(res, 200, 'Class deleted');
});
