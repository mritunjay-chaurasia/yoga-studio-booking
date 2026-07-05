import YogaClass from '../models/YogaClass.js';
import Booking from '../models/Booking.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { startOfToday, endOfToday } from '../utils/classHelpers.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const studioId = req.user.studioId;
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [totalClasses, todayClasses, totalBookings, classes] = await Promise.all([
    YogaClass.countDocuments({ studioId }),
    YogaClass.countDocuments({
      studioId,
      date: { $gte: todayStart, $lte: todayEnd },
    }),
    Booking.countDocuments({ studioId }),
    YogaClass.find({ studioId }).select('capacity'),
  ]);

  const classIds = classes.map((c) => c._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { yogaClass: { $in: classIds } } },
    { $group: { _id: '$yogaClass', count: { $sum: 1 } } },
  ]);
  const bookedMap = {};
  bookingCounts.forEach((b) => {
    bookedMap[b._id.toString()] = b.count;
  });

  let totalCapacity = 0;
  let totalBooked = 0;
  classes.forEach((c) => {
    totalCapacity += c.capacity;
    totalBooked += bookedMap[c._id.toString()] || 0;
  });

  const availableSeats = Math.max(0, totalCapacity - totalBooked);

  sendSuccess(res, 200, 'Dashboard stats fetched', {
    totalClasses,
    todayClasses,
    totalBookings,
    availableSeats,
  });
});
