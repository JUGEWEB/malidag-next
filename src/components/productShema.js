"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";

const ProductSchema = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [finalRating, setFinalRating] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProductAndReviews = async () => {
      try {
        // Fetch product
        const productRes = await fetch(`https://api.malidag.com/items`);
        const productData = await productRes.json();
        const foundProduct = productData.items.find(
          (item) => item.itemId === productId
        );
        setProduct(foundProduct?.item || null);

        // Fetch reviews
        const reviewsRes = await fetch(
          `https://api.malidag.com/get-reviews/${productId}`
        );
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.reviews);

          const total = reviewsData.reviews.reduce(
            (sum, r) => sum + (parseFloat(r.rating) || 5),
            0
          );
          const avg = (total / reviewsData.reviews.length).toFixed(2);
          setFinalRating(avg);
        }
      } catch (err) {
        console.error("Schema fetch failed:", err);
      }
    };

    fetchProductAndReviews();
  }, [productId]);

  if (!product || reviews.length === 0 || !finalRating) return null;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images?.[0],
    description: product.text || "Shop quality products on Malidag.",
    sku: productId,
    brand: {
      "@type": "Brand",
      name: "Malidag",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: finalRating,
      reviewCount: reviews.length,
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: parseFloat(r.rating) || 5,
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: r.name || "Anonymous",
      },
      reviewBody: r.comment,
      datePublished: new Date(r.date).toISOString(),
    })),
  };

  return (
    <Head>
      <title>{product.name} | Malidag</title>
      <meta
        name="description"
        content={`Shop ${product.name} at Malidag — ${product.theme || "Beauty & Care for You"}`}
      />
      <meta property="og:title" content={`${product.name} | Malidag`} />
      <meta
        property="og:description"
        content={`Buy ${product.name} on Malidag. ${product.text || "Discover great personal care products"}`}
      />
      <meta property="og:image" content={product.images?.[0]} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${product.name} | Malidag`} />
      <meta
        name="twitter:description"
        content={`Buy ${product.name} on Malidag — ${
          product.theme || "best in beauty and personal care"
        }`}
      />
      <meta name="twitter:image" content={product.images?.[0]} />
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Head>
  );
};

export default ProductSchema;
