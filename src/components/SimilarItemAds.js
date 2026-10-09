
"use client";

import React, { useEffect, useState } from "react";
import { Carousel } from "antd";
import { usePathname, useRouter } from "next/navigation";
import "./SimilarItemAds.css";

const API_BASE = "https://api.malidag.com";

const SimilarItemAds = ({ itemId }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const countryCode =
    pathname?.split("/").filter(Boolean)[0] || "fr";

  const withCountry = (path) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${countryCode.toLowerCase()}${cleanPath}`;
  };

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

        // Fetch related product IDs
        const similarRes = await fetch(
          `${API_BASE}/api/similar-items/${encodeURIComponent(itemId)}`,
          { signal: controller.signal }
        );

        if (!similarRes.ok) {
          throw new Error(
            `Similar ads API failed: ${similarRes.status}`
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

        // Fetch products
        const itemsRes = await fetch(`${API_BASE}/items`, {
          signal: controller.signal,
        });

        if (!itemsRes.ok) {
          throw new Error(
            `Items API failed: ${itemsRes.status}`
          );
        }

        const itemsData = await itemsRes.json();

        // Your API returns { items: [...] }
        const allItems = Array.isArray(itemsData)
          ? itemsData
          : itemsData?.items;

        if (!Array.isArray(allItems)) {
          console.error(
            "Unexpected /items response:",
            itemsData
          );
          setSimilarItems([]);
          return;
        }

        const similarIdSet = new Set(
          similarIds.map(String)
        );

        const matchedItems = allItems.filter((product) => {
          const productId = String(product?.itemId ?? "");

          return (
            similarIdSet.has(productId) &&
            productId !== String(itemId)
          );
        });

        // Preserve API order
        const productMap = new Map(
          matchedItems.map((product) => [
            String(product.itemId),
            product,
          ])
        );

        const orderedItems = similarIds
          .map((id) => productMap.get(String(id)))
          .filter(Boolean);

        setSimilarItems(orderedItems);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error(
          "Error loading similar item ads:",
          error
        );

        setSimilarItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSimilarItems();

    return () => controller.abort();
  }, [itemId]);

  if (loading || !similarItems.length) return null;

  const openProduct = (routeId) => {
    if (!routeId) return;

    router.push(
      withCountry(
        `/product/${encodeURIComponent(routeId)}`
      )
    );
  };

  return (
    <section
      className="similar-ads-section"
      aria-label="Recommended products"
    >
      <Carousel
        autoplay={similarItems.length > 1}
        autoplaySpeed={15000}
        speed={700}
        dots={similarItems.length > 1}
        pauseOnHover
        draggable
        className="similar-ads-carousel"
      >
        {similarItems.map((product) => {
          const image = product.item?.images?.[0];

          const name =
            product.item?.name ||
            product.details?.itemName ||
            "Featured product";

          const brand =
            product.item?.brand ||
            product.details?.brand ||
            "Malidag";

          const price =
            product.item?.usdPrice ??
            product.details?.usdText;

          const originalPrice =
            product.item?.originalPrice ??
            product.details?.originalPrice;

          const routeId = product.id;

          const priceNumber = Number(price);
          const originalPriceNumber = Number(originalPrice);

          const hasPrice =
            price !== undefined &&
            price !== null &&
            price !== "" &&
            Number.isFinite(priceNumber);

          const hasDiscount =
            hasPrice &&
            Number.isFinite(originalPriceNumber) &&
            originalPriceNumber > priceNumber;

          const formattedPrice = hasPrice
            ? `$${priceNumber.toFixed(2)}`
            : null;

          return (
            <div key={product.itemId}>
              <article className="similar-ad-slide">
                <div className="similar-ad-topline">
                  <span className="similar-ad-eyebrow">
                    <span className="similar-ad-sparkle">
                      ✦
                    </span>
                    DISCOVER YOUR NEXT LOOK
                  </span>

                  <span className="similar-ad-sponsored">
                    Recommended
                  </span>
                </div>

                <div className="similar-ad-main">
                  <div className="similar-ad-image-wrap">
                    {image && (
                      <img
                        src={encodeURI(image)}
                        alt={name}
                        className="similar-ad-slide-image"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="similar-ad-content">
                    <span className="similar-ad-brand">
                      {brand}
                    </span>

                    <h3 className="similar-ad-name">
                      {name}
                    </h3>

                    <p className="similar-ad-description">
                      A fresh addition to your wardrobe.
                    </p>

                    <div className="similar-ad-price-row">
                      {formattedPrice && (
                        <strong className="similar-ad-price">
                          {formattedPrice}
                        </strong>
                      )}

                      {hasDiscount && (
                        <span className="similar-ad-original-price">
                          ${originalPriceNumber.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="similar-ad-cta"
                      disabled={!routeId}
                      onClick={() => openProduct(routeId)}
                    >
                      <span>Shop this look</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>

                <div className="similar-ad-footer">
                  <span>
                    Curated for you on Malidag
                  </span>

                  <span className="similar-ad-footer-mark">
                    MALIDAG
                  </span>
                </div>
              </article>
            </div>
          );
        })}
      </Carousel>
    </section>
  );
};

export default SimilarItemAds;
