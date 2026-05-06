"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";

const fallbackNews = [
  {
    id: "madix-jewelry",
    title: "Jewelry shopping is expanding on Madix",
    description:
      "Madix is expanding jewelry collections with watches, rings, necklaces, bracelets, and premium accessories.",
    source: "Madix",
  },
  {
    id: "madix-store",
    title: "Watches store is now available",
    description:
      "Customers can now browse selected watch collections directly from the jewelry section.",
    source: "Madix",
  },
];

const MalidagNews = () => {
  const { isMobile, isSmallMobile, isVerySmall } = useScreenSize();

  const isPhone = isMobile || isSmallMobile || isVerySmall;

  const [articles, setArticles] = useState(fallbackNews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          "https://api.malidag.com/api/news"
        );

        const data = await response.json();

        if (
          data?.success &&
          Array.isArray(data.articles) &&
          data.articles.length > 0
        ) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error("News fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const containerStyle = {
    padding: isPhone ? "18px 14px" : "40px 28px",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    minHeight: "100vh",
    color: "#111827",
  };

  const heroStyle = {
    maxWidth: "900px",
    margin: "0 auto 36px",
    textAlign: "center",
  };

  const headingStyle = {
    fontSize: isPhone ? "32px" : "52px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
    marginBottom: "14px",
    color: "#111827",
  };

  const subtitleStyle = {
    fontSize: isPhone ? "15px" : "18px",
    lineHeight: 1.8,
    color: "#6b7280",
    maxWidth: "720px",
    margin: "0 auto",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isPhone
      ? "1fr"
      : "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "22px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    transition: "all 0.25s ease",
  };

  const imageStyle = {
    width: "100%",
    height: isPhone ? "220px" : "250px",
    objectFit: "cover",
    backgroundColor: "#f3f4f6",
    display: "block",
  };

  const contentStyle = {
    padding: isPhone ? "18px" : "24px",
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "14px",
  };

  const titleStyle = {
    fontSize: isPhone ? "20px" : "24px",
    fontWeight: "900",
    lineHeight: 1.3,
    marginBottom: "12px",
    color: "#111827",
  };

  const descriptionStyle = {
    fontSize: isPhone ? "14px" : "15px",
    color: "#4b5563",
    lineHeight: 1.8,
    marginBottom: "18px",
  };

  const footerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  };

  const dateStyle = {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: "600",
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#111827",
    fontWeight: "800",
    fontSize: "14px",
  };

  const loadingStyle = {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
    fontSize: "14px",
  };

  return (
    <div style={containerStyle}>
      <div style={heroStyle}>
        <h1 style={headingStyle}>Madix News</h1>

        <p style={subtitleStyle}>
          Explore marketplace updates, shopping highlights,
          fashion trends, jewelry collections, and curated
          retail news from around the world.
        </p>
      </div>

      {loading ? (
        <div style={loadingStyle}>
          Loading latest news...
        </div>
      ) : null}

      <div style={gridStyle}>
        {articles.map((article, index) => {
          const image =
            article.image ||
            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1200&auto=format&fit=crop";

          return (
            <article
              key={article.id || article.url || index}
              style={cardStyle}
            >
              <img
                src={image}
                alt={article.title}
                style={imageStyle}
                onError={(e) => {
                  e.currentTarget.onerror = null;

                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1200&auto=format&fit=crop";
                }}
              />

              <div style={contentStyle}>
                <span style={badgeStyle}>
                  {article.author ||
                    article.source ||
                    "Madix News"}
                </span>

                <h2 style={titleStyle}>
                  {article.title}
                </h2>

                <p style={descriptionStyle}>
                  {article.description ||
                    "Read the latest news update from Madix."}
                </p>

                <div style={footerStyle}>
                  <span style={dateStyle}>
                    {article.published
                      ? new Date(
                          article.published
                        ).toLocaleDateString()
                      : "Latest update"}
                  </span>

                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      Read more →
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default MalidagNews;