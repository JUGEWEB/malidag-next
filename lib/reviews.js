// lib/reviews.js
import clientPromise from "./mongodb.js";

export async function getReviewsForProductId(productId) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // 1. Get product by `id`
  const product = await db.collection("products").findOne({ id: productId });
  if (!product) {
    return { itemName: null, reviews: [], avg: 0, count: 0 };
  }

  // ✅ use product.itemId as folderId
  const folderId = product.itemId;
  if (!folderId) {
    return {
      itemName: product.item?.name || product.name || "",
      reviews: [],
      avg: 0,
      count: 0,
    };
  }

  // 2. Get reviews by folderId
  const reviewDoc = await db.collection("reviews").findOne({ folderId });

  if (!reviewDoc) {
    return {
      itemName: product.item?.name || product.name || "",
      reviews: [],
      avg: 0,
      count: 0,
    };
  }

  const reviews = reviewDoc.reviews || [];
  const count = reviews.length;
  const avg =
    count > 0
      ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / count
      : 0;

  return {
    itemName: reviewDoc.itemName || product.item?.name || product.name || "",
    reviews,
    avg: Number(avg.toFixed(1)),
    count,
  };
}
