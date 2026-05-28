/** Shared env helpers for local dev vs production. */

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || 'dev_secret';
}

export function getCorsOrigins() {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in production');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be a strong secret (32+ characters) in production');
  }
  if (!process.env.CLIENT_URL) {
    console.warn('Warning: CLIENT_URL is not set; CORS will fall back to localhost origins only');
  }
}
