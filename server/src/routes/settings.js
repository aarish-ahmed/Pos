import express from 'express';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

router.put('/', protect, authorize('admin', 'manager'), async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
});

router.get('/users', protect, authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password').sort('name');
  res.json(users);
});

router.post('/users', protect, authorize('admin'), async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
});

export default router;
