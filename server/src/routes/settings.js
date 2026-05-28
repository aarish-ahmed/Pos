import express from 'express';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

router.put('/', protect, requirePermission('settings.general'), async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
});

router.get('/users', protect, requirePermission('settings.staff'), async (req, res) => {
  const users = await User.find().select('-password').sort('name');
  res.json(users);
});

router.post('/users', protect, requirePermission('settings.staff'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  const user = await User.create({ name, email, password, role: role || 'waiter' });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
});

router.patch('/users/:id', protect, requirePermission('settings.staff'), async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  if (String(target._id) === String(req.user._id) && req.body.isActive === false) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  if (req.body.role != null) {
    const roles = ['admin', 'manager', 'cashier', 'waiter'];
    if (!roles.includes(req.body.role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (target.role === 'admin' && req.body.role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot change role of the only admin' });
      }
    }
    target.role = req.body.role;
  }

  if (req.body.isActive !== undefined) {
    if (target.role === 'admin' && req.body.isActive === false) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the only admin' });
      }
    }
    target.isActive = Boolean(req.body.isActive);
  }

  await target.save();
  const safe = target.toObject();
  delete safe.password;
  res.json(safe);
});

router.delete('/users/:id', protect, requirePermission('settings.staff'), async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  if (String(target._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only admin account' });
    }
  }

  await target.deleteOne();
  res.json({ message: 'Staff member removed' });
});

export default router;
