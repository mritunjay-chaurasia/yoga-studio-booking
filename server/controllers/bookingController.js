import Booking from '../models/Booking.js';
import YogaClass from '../models/YogaClass.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  isClassPast,
  hasStudentScheduleConflict,
} from '../utils/classHelpers.js';

export const createBooking = asyncHandler(async (req, res) => {
  const { yogaClass: yogaClassId } = req.body;
  const student = req.user._id;

  const yogaClass = await YogaClass.findById(yogaClassId);
  if (!yogaClass) {
    return sendError(res, 404, 'Class not found');
  }

  if (isClassPast(yogaClass)) {
    return sendError(res, 400, 'Cannot book a past class');
  }

  if (yogaClass.studioId !== req.user.studioId) {
    return sendError(res, 403, 'Access denied');
  }

  const existing = await Booking.findOne({ student, yogaClass: yogaClassId });
  if (existing) {
    return sendError(res, 409, 'Already booked');
  }

  const bookingCount = await Booking.countDocuments({ yogaClass: yogaClassId });
  if (bookingCount >= yogaClass.capacity) {
    return sendError(res, 400, 'Class Full');
  }

  const scheduleConflict = await hasStudentScheduleConflict(student, yogaClass);
  if (scheduleConflict) {
    return sendError(res, 409, 'You already have a class at this time');
  }

  try {
    const booking = await Booking.create({
      student,
      yogaClass: yogaClassId,
      studioId: req.user.studioId,
    });

    // Rare race: two bookings at once — roll back if over capacity
    const total = await Booking.countDocuments({ yogaClass: yogaClassId });
    if (total > yogaClass.capacity) {
      await booking.deleteOne();
      return sendError(res, 400, 'Class Full');
    }

    await booking.populate([
      { path: 'student', select: 'name email phone role' },
      {
        path: 'yogaClass',
        populate: { path: 'instructor', select: 'name email phone role' },
      },
    ]);

    sendSuccess(res, 201, 'Booking created', { booking });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'Already booked');
    }
    throw err;
  }
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return sendError(res, 404, 'Booking not found');
  }
  if (booking.studioId !== req.user.studioId && req.user.role !== 'admin') {
    return sendError(res, 403, 'Access denied');
  }
  await booking.deleteOne();
  sendSuccess(res, 200, 'Booking cancelled');
});

export const getStudentBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    student: req.params.id,
    studioId: req.user.studioId,
  })
    .populate({
      path: 'yogaClass',
      populate: { path: 'instructor', select: 'name email phone role' },
    })
    .sort({ bookedAt: -1 });

  sendSuccess(res, 200, 'Student bookings fetched', { bookings });
});

export const getClassBookings = asyncHandler(async (req, res) => {
  const yogaClass = await YogaClass.findById(req.params.id);
  if (!yogaClass) {
    return sendError(res, 404, 'Class not found');
  }

  if (yogaClass.studioId !== req.user.studioId) {
    return sendError(res, 403, 'Access denied');
  }

  if (
    req.user.role === 'instructor' &&
    yogaClass.instructor.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 403, 'Access denied');
  }

  const bookings = await Booking.find({ yogaClass: req.params.id })
    .populate('student', 'name email phone role')
    .sort({ bookedAt: 1 });

  sendSuccess(res, 200, 'Class bookings fetched', { bookings });
});
