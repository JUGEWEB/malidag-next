import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fetch from "node-fetch";
import clientPromise from "../lib/mongodb.js";

const API_URL = "https://api.malidag.com/items";

async function updateProducts() {
  try {
    console.log("🚀 Starting updateProducts...");

    const res = await fetch(API_URL);
    console.log("✅ API responded:", res.status);

    if (!res.ok) throw new Error("Failed to fetch API");
    const data = await res.json();
    console.log("✅ Data received:", Object.keys(data));

    const products = data.items || [];
    console.log(`📦 Found ${products.length} products`);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("products");
    console.log("✅ Connected to MongoDB");

    for (const product of products) {
      await collection.updateOne(
        { id: product.id },
        {
          $set: {
            name: product.item?.name || "",
            description: product.item?.description || "",
            image_url: product.item?.images?.[0] || "",
            updated_at: new Date(),
          },
        },
        { upsert: true }
      );
    }

    console.log(`✅ Updated ${products.length} products in MongoDB`);
  } catch (err) {
    console.error("❌ Error updating products:", err);
  }
}

updateProducts();

