import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cloudinary } from '../config/cloudinary.js';
import { isCloudinaryConfigured } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadDir = path.join(__dirname, '../../uploads/menu');

function ensureLocalDir() {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

function localFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const safeExt = allowed.includes(ext) ? ext : '.jpg';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'restaurant_pos/menu', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/** Store menu image in Cloudinary (production) or local disk (local dev). */
export async function storeMenuImage(file) {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file.buffer);
  }

  ensureLocalDir();
  const filename = localFilename(file.originalname);
  const filepath = path.join(localUploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);
  return `/uploads/menu/${filename}`;
}
