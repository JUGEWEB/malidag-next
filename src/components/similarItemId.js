
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import "./SimilarItemId.css";

const API_BASE = "https://api.malidag.com";

const SimilarItemId = ({ itemId }) => {
  const pathname = usePathname();
const router = useRouter();

const countryCode = pathname?.split("/").filter(Boolean)[0] || "fr";

const withCountry = (path) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `/${countryCode.toLowerCase()}${cleanPath}`;
};
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setSimilarItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchSimilarItems = async () => {
      try {
        setLoading(true);
        setSimilarItems([]);

        // 1. Fetch similar product IDs
        const similarRes = await fetch(
          `${API_BASE}/api/similar-items/${encodeURIComponent(itemId)}`,
          { signal: controller.signal }
        );

        if (!similarRes.ok) {
          throw new Error(
            `Similar items API failed: ${similarRes.status}`
          );
        }

        const similarData = await similarRes.json();

        const similarIds = Array.isArray(similarData?.similarItemIds)
          ? similarData.similarItemIds
          : [];

        if (!similarIds.length) {
          setSimilarItems([]);
          return;
        }

        // 2. Fetch all products
        const itemsRes = await fetch(`${API_BASE}/items`, {
          signal: controller.signal,
        });

        if (!itemsRes.ok) {
          throw new Error(
            `Products API failed: ${itemsRes.status}`
          );
        }

        const itemsData = await itemsRes.json();

        // IMPORTANT:
        // Your API returns { items: [...] }, not just [...]
        const allItems = Array.isArray(itemsData)
          ? itemsData
          : itemsData?.items;

        if (!Array.isArray(allItems)) {
          console.error(
            "Unexpected /items response structure:",
            itemsData
          );

          setSimilarItems([]);
          return;
        }

        // 3. Match products by their itemId
        const similarIdSet = new Set(
          similarIds.map((id) => String(id))
        );

        const matchedItems = allItems.filter((product) => {
          const productId = String(product?.itemId ?? "");

          return (
            similarIdSet.has(productId) &&
            productId !== String(itemId)
          );
        });

        // 4. Preserve the order returned by the similar-items API
        const productById = new Map(
          matchedItems.map((product) => [
            String(product.itemId),
            product,
          ])
        );

        const orderedItems = similarIds
          .map((id) => productById.get(String(id)))
          .filter(Boolean);

        setSimilarItems(orderedItems);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Error loading similar items:", error);
        setSimilarItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSimilarItems();

    // Cancel old requests when itemId changes or component unmounts
    return () => {
      controller.abort();
    };
  }, [itemId]);

  if (loading) {
    return (
      <p className="similar-items-loading">
        Loading similar items...
      </p>
    );
  }

  if (!similarItems.length) return null;

  const compactLayout = similarItems.length <= 3;

  return (
    <section className="similar-items-section">
      <div className="similar-items-header">
        <h2 className="similar-items-title">
          Get what's right for you.
        </h2>

        <p className="similar-items-subtitle">
          Compare similar options picked for this item.
        </p>
      </div>

      <div
        className={
          compactLayout
            ? "similar-items-scroll similar-items-scroll-wide"
            : "similar-items-scroll similar-items-scroll-normal"
        }
      >
        {similarItems.map((product) => {
          const image = product.item?.images?.[0];

          const name =
            product.item?.name ||
            product.details?.itemName ||
            "Product";

          const brand =
            product.item?.brand ||
            product.details?.brand ||
            "";

          const price = product.item?.usdPrice;

          // Numeric/string product identifier for matching
          const productId = product.itemId;

          // UUID used by your /product/[id] page
          const routeId = product.id;

          return (
            <article
              key={productId}
              className={
                compactLayout
                  ? "similar-item-card similar-item-card-wide"
                  : "similar-item-card similar-item-card-normal"
              }
            >
              <div className="similar-item-image-wrap">
                {image && (
                  <img
                    src={encodeURI(image)}
                    alt={name}
                    className="similar-item-image"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="similar-item-info">
                {brand && (
                  <h3 className="similar-item-brand">
                    {brand}
                  </h3>
                )}

                <p className="similar-item-name">
                  {name}
                </p>

                {price !== undefined &&
                  price !== null &&
                  price !== "" && (
                    <p className="similar-item-price">
                      ${price}
                    </p>
                  )}

               <button
              type="button"
              className="similar-item-buy-btn"
              disabled={!routeId}
              onClick={() => {
                if (!routeId) return;

                router.push(
                  withCountry(`/product/${encodeURIComponent(routeId)}`)
                );
              }}
            >
              View product
              <FaArrowUpRightFromSquare aria-hidden="true" />
            </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarItemId;
