
export const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) {
    return imageEntry.url;
  }
  return "";
};

export const getColorOptions = (product) => {
  return Object.keys(product?.imagesVariants || {});
};

export const getFirstVideoUrl = (product) => {
  if (!Array.isArray(product?.videos)) {
    return null;
  }

  for (const video of product.videos) {
    let url = "";

    if (typeof video === "string") {
      url = video.trim();
    }

    if (
      typeof video === "object" &&
      video !== null &&
      typeof video.url === "string"
    ) {
      url = video.url.trim();
    }

    if (!url) continue;

    const normalized = url.toLowerCase();

    if (
      normalized === "null" ||
      normalized === "undefined" ||
      normalized === "false" ||
      normalized === "n/a"
    ) {
      continue;
    }

    return url;
  }

  return null;
};

export const getDiscountPercentage = (usdPrice, originalPrice) => {
  const current = Number(usdPrice || 0);
  const original = Number(originalPrice || 0);

  if (!original || current >= original) return 0;

  return Math.round(((original - current) / original) * 100);
};


export function getProductDisplayImage(
  product,
  selectedColorByItem
) {
  const variants = product?.imagesVariants || {};

  const availableColors = Object.keys(variants).filter(
    (color) =>
      Array.isArray(variants[color]) &&
      variants[color].some((image) => getImageUrl(image))
  );

  const requestedColor = selectedColorByItem[product.id];

  const selectedColor = availableColors.includes(requestedColor)
    ? requestedColor
    : availableColors[0];

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" &&
        typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" &&
        typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.images?.[0]) || "/fallback.png";
}
