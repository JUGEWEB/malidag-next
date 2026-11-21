
export const normalizeTopItem = (product) => ({
  id: product?.id || "",
  itemId: product?.itemId || "",
  name: product?.name || "",
  images: Array.isArray(product?.images) ? product.images : [],
  videos: Array.isArray(product?.videos) ? product.videos : [],
  department: product?.department || "",
  brandType: product?.brandType || "",
  size: product?.size || {},
  usdPrice: product?.usdPrice || product?.price || 0,
  originalPrice: product?.originalPrice || 0,
  rating: product?.rating || 0,
  imagesVariants: product?.imagesVariants || {},
});

export const normalizeBestSeller = (product) => {
  const source = product?.item || {};

  return {
    id: product?.id || "",
    itemId: product?.itemId || "",
    name: source?.name || "",
    images: Array.isArray(source?.images) ? source.images : [],
    videos: Array.isArray(source?.videos) ? source.videos : [],
    department: source?.department || product?.details?.department || "",
    brandType: source?.brandType || product?.details?.brandType || "",
    usdPrice: source?.usdPrice || product?.usdPrice || 0,
    originalPrice: source?.originalPrice || product?.originalPrice || 0,
    size: source?.size || {},
    rating: source?.rating || product?.rating || 0,
    imagesVariants: source?.imagesVariants || {},
    rawItem: product,
  };
};

export const normalizeBrandItem = (product) => {
  const source = product?.item || {};

  return {
    id: product?.id || "",
    itemId: product?.itemId || source?.id || "",
    name: source?.name || "",
    images: Array.isArray(source?.images) ? source.images : [],
    videos: Array.isArray(source?.videos) ? source.videos : [],
    department: source?.department || "",
    brandType: source?.brandType || "",
    size: source?.size || {},
    usdPrice: source?.usdPrice || product?.usdPrice || 0,
    originalPrice: source?.originalPrice || product?.originalPrice || 0,
    rating: source?.rating || product?.rating || 0,
    imagesVariants: source?.imagesVariants || {},
    rawItem: product,
  };
};
