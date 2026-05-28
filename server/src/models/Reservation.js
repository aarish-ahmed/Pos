import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    partySize: { type: Number, required: true, min: 1, default: 2 },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['booked', 'seated', 'cancelled', 'no-show'], default: 'booked' },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

reservationSchema.index({ startAt: 1 });
reservationSchema.index({ table: 1, startAt: 1, endAt: 1 });

export default mongoose.model('Reservation', reservationSchema);
