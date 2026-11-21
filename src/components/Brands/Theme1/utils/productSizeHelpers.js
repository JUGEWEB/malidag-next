
export const getSizesForColor = (product, color) => {
  const sizeMap = product?.size || product?.rawItem?.item?.size || {};
  const keys = Object.keys(sizeMap);

  const key = keys.find(
    (key) =>
      key.trim().toLowerCase() ===
      String(color || "").trim().toLowerCase()
  );

  const selectedKey = key || (!color && keys.length === 1 ? keys[0] : null);

  if (!selectedKey) return [];

  const entries = Array.isArray(sizeMap[selectedKey])
    ? sizeMap[selectedKey]
    : [sizeMap[selectedKey]];

  const options = new Map();

  const splitValues = (value) =>
    (Array.isArray(value) ? value : String(value ?? "").split(/[,;]|\.(?=\s*\d)/))
      .map((part) => String(part).trim())
      .filter(Boolean);

  entries.forEach((entry) => {
    const rawSizes =
      typeof entry === "object" && entry !== null
        ? entry.value
        : entry;

    const rawLengths =
      typeof entry === "object" && entry !== null
        ? entry.length
        : null;

    const price =
      typeof entry === "object" &&
      entry !== null &&
      entry.price != null &&
      entry.price !== ""
        ? Number(entry.price)
        : null;

    const lengths = splitValues(rawLengths);

    splitValues(rawSizes).forEach((value) => {
      if (!options.has(value)) {
        options.set(value, {
          value,
          price: Number.isFinite(price) && price > 0 ? price : null,
          lengths: [...lengths],
        });
      } else {
        const existing = options.get(value);

        existing.lengths = [
          ...new Set([...existing.lengths, ...lengths]),
        ];
      }
    });
  });

  return [...options.values()];
};
