
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import "./CompleteTheLook.css";

const API_BASE = "https://api.malidag.com";

const getImageUrl = (entry) => {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") {
    return entry.url || "";
  }
  return "";
};

const getColorImages = (product, requestedColor) => {
  const variants = product?.item?.imagesVariants || {};

  const matchingColor = Object.keys(variants).find(
    (color) =>
      color.trim().toLowerCase() ===
      String(requestedColor).trim().toLowerCase()
  );

  if (!matchingColor) return [];

  const images = variants[matchingColor];

  if (!Array.isArray(images)) return [];

  return [...images]
    .sort((a, b) => {
      const positionA =
        typeof a === "object" && Number.isFinite(a?.position)
          ? a.position
          : 999999;

      const positionB =
        typeof b === "object" && Number.isFinite(b?.position)
          ? b.position
          : 999999;

      return positionA - positionB;
    })
    .map(getImageUrl)
    .filter(Boolean);
};

export default function CompleteTheLook({ itemId }) {
  const pathname = usePathname();
  const router = useRouter();

  const countryCode =
    pathname?.split("/").filter(Boolean)[0] || "fr";

  const withCountry = (path) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${countryCode.toLowerCase()}${cleanPath}`;
  };

  const [lookItems, setLookItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setLookItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchCompleteLook = async () => {
      try {
        setLoading(true);
        setLookItems([]);

        // 1. Get configured itemId + color pairs
        const lookResponse = await fetch(
          `${API_BASE}/api/complete-the-look/${encodeURIComponent(itemId)}`,
          { signal: controller.signal }
        );

        if (!lookResponse.ok) {
          throw new Error(
            `Complete the Look API failed: ${lookResponse.status}`
          );
        }

        const lookData = await lookResponse.json();

        const configuredItems = Array.isArray(lookData?.items)
          ? lookData.items
          : [];

        if (!configuredItems.length) {
          setLookItems([]);
          return;
        }

        // 2. Fetch product information
        const productsResponse = await fetch(
          `${API_BASE}/items`,
          { signal: controller.signal }
        );

        if (!productsResponse.ok) {
          throw new Error(
            `Products API failed: ${productsResponse.status}`
          );
        }

        const productsData = await productsResponse.json();

        const allProducts = Array.isArray(productsData)
          ? productsData
          : productsData?.items;

        if (!Array.isArray(allProducts)) {
          throw new Error("Unexpected /items response structure.");
        }

        // 3. Match product IDs
        const productMap = new Map(
          allProducts.map((product) => [
            String(product?.itemId),
            product,
          ])
        );

        // 4. Preserve saved order and exact configured colors
        const matchedItems = configuredItems
          .map(({ itemId: relatedId, color }) => {
            const product = productMap.get(String(relatedId));

            if (!product) return null;

            const images = getColorImages(product, color);

            // Do not fall back to another color
            if (!images.length) return null;

            return {
              product,
              color,
              image: images[0],
            };
          })
          .filter(Boolean);

        if (!controller.signal.aborted) {
          setLookItems(matchedItems);
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Error loading Complete the Look:", error);

        if (!controller.signal.aborted) {
          setLookItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCompleteLook();

    return () => controller.abort();
  }, [itemId]);

  if (loading) {
    return (
      <p className="ctl-loading">
        Loading Complete the Look...
      </p>
    );
  }

  if (!lookItems.length) return null;

  return (
    <section className="ctl-section">
      <div className="ctl-header">
        <span className="ctl-eyebrow">Styled together</span>
        <h2 className="ctl-title">Complete the Look</h2>
        <p className="ctl-subtitle">
          The finishing pieces that make the outfit.
        </p>
      </div>

      <div className="ctl-products">
        {lookItems.map(({ product, color, image }) => {
          const name =
            product.item?.name ||
            product.details?.itemName ||
            "Product";

          const brand =
            product.item?.brand ||
            product.details?.brand ||
            "";

          const price = product.item?.usdPrice;
          const routeId = product.id;

          return (
            <article
              key={product.itemId}
              className="ctl-card"
            >
              <div className="ctl-image-wrap">
                <img
                  src={encodeURI(image)}
                  alt={`${name} - ${color}`}
                  className="ctl-image"
                  loading="lazy"
                />
              </div>

              <div className="ctl-card-content">
                {brand && (
                  <p className="ctl-brand">{brand}</p>
                )}

                <h3 className="ctl-product-name">
                  {name}
                </h3>

                <p className="ctl-color">
                  Color: <strong>{color}</strong>
                </p>

                {price !== undefined &&
                  price !== null &&
                  price !== "" && (
                    <p className="ctl-price">
                      ${Number(price).toFixed(2)}
                    </p>
                  )}

                <button
                  type="button"
                  className="ctl-view-button"
                  disabled={!routeId}
                  onClick={() => {
                    if (!routeId) return;

                    router.push(
                      withCountry(
                        `/product/${encodeURIComponent(routeId)}`
                      )
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
}
