import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: 'Bistro POS' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    taxRate: { type: Number, default: 0.08 },
    serviceChargeRate: { type: Number, default: 0.1 },
    serviceChargeEnabled: { type: Boolean, default: true },
    receiptFooter: { type: String, default: 'Thank you for dining with us!' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
