import mongoose from 'mongoose';

const yogaClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    studioId: {
      type: String,
      default: 'default',
      index: true,
    },
  },
  { timestamps: true }
);

yogaClassSchema.index({ date: 1, studioId: 1 });

const YogaClass = mongoose.model('YogaClass', yogaClassSchema);
export default YogaClass;
