import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
});

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['cash', 'card', 'mobile', 'split'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['open', 'sent', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
      default: 'open',
    },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    payments: [paymentSchema],
    amountPaid: { type: Number, default: 0 },
    changeDue: { type: Number, default: 0 },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
