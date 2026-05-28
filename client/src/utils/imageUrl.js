const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

/** Resolve menu image paths for dev (proxy), production API host, or full URLs. */
export const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')) {
    return image;
  }
  const path = image.startsWith('/') ? image : `/${image}`;
  return apiOrigin ? `${apiOrigin}${path}` : path;
};
