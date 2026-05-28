import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    prepTime: { type: Number, default: 15 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('MenuItem', menuItemSchema);
