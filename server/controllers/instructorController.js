import YogaClass from '../models/YogaClass.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { enrichClassesWithSeats } from '../utils/classHelpers.js';
import { startOfToday, endOfToday } from '../utils/classHelpers.js';

export const getInstructorSchedule = asyncHandler(async (req, res) => {
  const instructor = await User.findById(req.params.id);
  if (!instructor || instructor.role !== 'instructor') {
    return sendError(res, 404, 'Instructor not found');
  }
  if (instructor.studioId !== req.user.studioId) {
    return sendError(res, 403, 'Access denied');
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [todayClasses, upcomingClasses] = await Promise.all([
    YogaClass.find({
      instructor: req.params.id,
      studioId: req.user.studioId,
      date: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('instructor', 'name email phone role')
      .sort({ startTime: 1 }),
    YogaClass.find({
      instructor: req.params.id,
      studioId: req.user.studioId,
      date: { $gt: todayEnd },
    })
      .populate('instructor', 'name email phone role')
      .sort({ date: 1, startTime: 1 }),
  ]);

  const allClassIds = [...todayClasses, ...upcomingClasses].map((c) => c._id);
  const bookings = await Booking.find({ yogaClass: { $in: allClassIds } }).populate(
    'student',
    'name email phone'
  );

  const bookingsByClass = {};
  bookings.forEach((b) => {
    const key = b.yogaClass.toString();
    if (!bookingsByClass[key]) bookingsByClass[key] = [];
    bookingsByClass[key].push(b);
  });

  const [enrichedToday, enrichedUpcoming] = await Promise.all([
    enrichClassesWithSeats(todayClasses),
    enrichClassesWithSeats(upcomingClasses),
  ]);

  const todayWithStudents = enrichedToday.map((c) => ({
    ...c,
    students: (bookingsByClass[c._id.toString()] || []).map((b) => b.student),
  }));

  const upcomingWithStudents = enrichedUpcoming.map((c) => ({
    ...c,
    students: (bookingsByClass[c._id.toString()] || []).map((b) => b.student),
  }));

  sendSuccess(res, 200, 'Schedule fetched', {
    instructor,
    todayClasses: todayWithStudents,
    upcomingClasses: upcomingWithStudents,
  });
});
