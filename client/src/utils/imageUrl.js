/** Resolve menu image paths for dev (proxy) and production. */
export const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')) {
    return image;
  }
  return image.startsWith('/') ? image : `/${image}`;
};
