"use client";

import React, { useState } from "react";
import useScreenSize from "./useIsMobile";

const ImageZoom = ({ selectedImage, basketItems = [] }) => {
  const [zoomedPosition, setZoomedPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const { isDesktop } = useScreenSize();

  const hasBasketItems = Array.isArray(basketItems) && basketItems.length > 0;
  const imageWidth = isDesktop && hasBasketItems ? "400px" : "500px";

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomedPosition({
      x: Math.max(0, Math.min(100, xPercent)),
      y: Math.max(0, Math.min(100, yPercent)),
    });
  };

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
      <img
        src={selectedImage}
        alt="Zoomable Product"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />

      {isHovered && (
        <div
          className="zoomed-image"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            backgroundImage: `url(${selectedImage})`,
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