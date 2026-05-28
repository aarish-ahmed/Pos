import express from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { protect, authorize } from '../middleware/auth.js';
import { menuImageUpload } from '../middleware/upload.js';
import { storeMenuImage } from '../services/menuImageStorage.js';

const router = express.Router();

router.get('/categories', protect, async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder');
  res.json(categories);
});

router.get('/items', protect, async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.available !== 'false') filter.isAvailable = true;
  const items = await MenuItem.find(filter).populate('category').sort('name');
  res.json(items);
});

router.get('/all', protect, async (req, res) => {
  const [categories, items] = await Promise.all([
    Category.find().sort('sortOrder'),
    MenuItem.find().populate('category').sort('name'),
  ]);
  res.json({ categories, items });
});

router.post('/categories', protect, authorize('admin', 'manager'), async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

router.patch('/categories/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

router.post('/upload-image', protect, authorize('admin', 'manager'), (req, res) => {
  menuImageUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    try {
      const url = await storeMenuImage(req.file);
      res.json({ url });
    } catch (uploadErr) {
      console.error(uploadErr);
      res.status(500).json({ message: uploadErr.message || 'Image upload failed' });
    }
  });
});

router.post('/items', protect, authorize('admin', 'manager'), async (req, res) => {
  const item = await MenuItem.create(req.body);
  res.status(201).json(item);
});

router.patch('/items/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

router.delete('/items/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Item deleted' });
});

export default router;
