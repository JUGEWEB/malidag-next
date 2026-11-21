const BASE_URL = "https://dummyjson.com/products";

const SAMPLE_CATEGORIES = [
  "mens-shirts",
  "mens-shoes",
  "womens-dresses",
  "womens-bags",
  "mens-watches",
  "womens-shoes",
];

export async function fetchMwsSampleProducts() {
  const results = await Promise.allSettled(
    SAMPLE_CATEGORIES.map(async (category) => {
      const response = await fetch(
        `${BASE_URL}/category/${category}?limit=5`
      );

      if (!response.ok) {
        throw new Error(`Failed to load ${category}`);
      }

      const data = await response.json();

      return (data.products || []).map((product) => {
        const [group, type] = category.split("-");

        const department =
          group === "mens"
            ? "men"
            : "women";

        const brandType =
          type === "shirts"
            ? "Clothing"
            : type === "dresses"
            ? "Clothing"
            : type === "bags"
            ? "Bags"
            : type === "watches"
            ? "Accessories"
            : "Shoes";

        return {
          id: `mws-demo-${category}-${product.id}`,
          itemId: "",
          name: product.title,
          usdPrice: Number(product.price) || 0,
          originalPrice: 0,
          department,
          brandType,
          images: [product.thumbnail],
          imagesVariants: {},
          size: {},
          videos: [],
          rating: 0,
          isMwsSample: true,
        };
      });
    })
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}