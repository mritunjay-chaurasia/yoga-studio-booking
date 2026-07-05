import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    yogaClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YogaClass',
      required: true,
    },
    bookedAt: { type: Date, default: Date.now },
    studioId: {
      type: String,
      default: 'default',
      index: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ student: 1, yogaClass: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
