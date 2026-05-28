import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    color: { type: String, default: '#6b9080' },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
