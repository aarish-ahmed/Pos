import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { can } from '../config/permissions.js';
import { getJwtSecret } from '../config/env.js';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user?.isActive) {
      return res.status(401).json({ message: 'Account inactive' });
    }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!can(req.user.role, permission)) {
    return res.status(403).json({ message: 'Insufficient permissions for this action' });
  }
  next();
};
