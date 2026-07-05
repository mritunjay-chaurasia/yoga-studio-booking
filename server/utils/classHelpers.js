import YogaClass from '../models/YogaClass.js';
import Booking from '../models/Booking.js';

export const getBookingCounts = async (classIds) => {
  const counts = await Booking.aggregate([
    { $match: { yogaClass: { $in: classIds } } },
    { $group: { _id: '$yogaClass', count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach((c) => {
    map[c._id.toString()] = c.count;
  });
  return map;
};

export const enrichClassWithSeats = (yogaClass, bookingCounts) => {
  const obj = yogaClass.toObject ? yogaClass.toObject() : { ...yogaClass };
  const booked = bookingCounts[obj._id.toString()] || 0;
  return {
    ...obj,
    bookedCount: booked,
    seatsLeft: Math.max(0, obj.capacity - booked),
  };
};

export const enrichClassesWithSeats = async (classes) => {
  if (!classes.length) return [];
  const ids = classes.map((c) => c._id);
  const counts = await getBookingCounts(ids);
  return classes.map((c) => enrichClassWithSeats(c, counts));
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getClassDateTime = (yogaClass, timeField = 'startTime') => {
  const d = new Date(yogaClass.date);
  const [h, m] = yogaClass[timeField].split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

export const isClassPast = (yogaClass) =>
  getClassDateTime(yogaClass, 'endTime') < new Date();

export const timesOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

export const hasInstructorConflict = async (
  instructorId,
  date,
  startTime,
  endTime,
  excludeClassId = null
) => {
  const day = new Date(date);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const filter = {
    instructor: instructorId,
    date: { $gte: day, $lt: nextDay },
  };
  if (excludeClassId) filter._id = { $ne: excludeClassId };

  const classes = await YogaClass.find(filter);
  const newStart = getClassDateTime({ date, startTime }, 'startTime');
  const newEnd = getClassDateTime({ date, endTime }, 'endTime');

  return classes.some((c) => {
    const existingStart = getClassDateTime(c, 'startTime');
    const existingEnd = getClassDateTime(c, 'endTime');
    return timesOverlap(newStart, newEnd, existingStart, existingEnd);
  });
};

export const hasStudentScheduleConflict = async (
  studentId,
  yogaClass,
  excludeClassId = null
) => {
  const bookings = await Booking.find({ student: studentId }).populate('yogaClass');
  const newStart = getClassDateTime(yogaClass, 'startTime');
  const newEnd = getClassDateTime(yogaClass, 'endTime');

  return bookings.some((b) => {
    const existing = b.yogaClass;
    if (!existing || existing._id.toString() === excludeClassId) return false;
    const existingStart = getClassDateTime(existing, 'startTime');
    const existingEnd = getClassDateTime(existing, 'endTime');
    return timesOverlap(newStart, newEnd, existingStart, existingEnd);
  });
};
