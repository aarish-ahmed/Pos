import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    name: { type: String, trim: true },
    capacity: { type: Number, default: 4 },
    zone: { type: String, default: 'Main', trim: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'cleaning'],
      default: 'available',
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Table', tableSchema);
