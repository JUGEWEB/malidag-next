
"use client";

import React, { useState, useEffect } from "react";
import useScreenSize from "./useIsMobile";
import Image from "next/image";

const ImageZoom = ({ selectedImage, basketItems = [] }) => {
  const [zoomedPosition, setZoomedPosition] = useState({
    x: 50,
    y: 50,
  });

  const [isHovered, setIsHovered] = useState(false);
  const { isDesktop } = useScreenSize();

  const hasBasketItems =
    Array.isArray(basketItems) && basketItems.length > 0;

  const imageWidth =
    isDesktop && hasBasketItems ? "400px" : "500px";

  useEffect(() => {
    setIsHovered(false);
    setZoomedPosition({ x: 50, y: 50 });
  }, [selectedImage]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const xPercent =
      ((e.clientX - rect.left) / rect.width) * 100;

    const yPercent =
      ((e.clientY - rect.top) / rect.height) * 100;

    setZoomedPosition({
      x: Math.max(0, Math.min(100, xPercent)),
      y: Math.max(0, Math.min(100, yPercent)),
    });
  };

  if (!selectedImage) return null;

  const imageSrc = encodeURI(selectedImage);

  return (
    <div
      className="image-container"
      style={{
        position: "relative",
        width: imageWidth,
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "zoom-in",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        key={imageSrc}
        src={imageSrc}
        alt="Zoomable Product"
        fill
        quality={85}
        sizes="(max-width: 1024px) 100vw, 500px"
        draggable={false}
        style={{
          objectFit: "contain",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />

      {isHovered && (
        <div
          key={`zoom-${imageSrc}`}
          className="zoomed-image"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            backgroundImage: `url("${imageSrc}")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "200%",
            backgroundPosition: `${zoomedPosition.x}% ${zoomedPosition.y}%`,
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom;
