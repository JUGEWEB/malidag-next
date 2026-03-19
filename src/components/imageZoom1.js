"use client";

import React, { useRef, useState } from "react";
import useScreenSize from "./useIsMobile";

const LENS_HEIGHT = 379;

const ImageZoom1 = ({
  selectedImage,
  onMouseEnter,
  onMouseLeave,
  isZoomVisible,
  onMouseMove,
  basketItems,
}) => {
  const { isDesktop } = useScreenSize();
  const imageRef = useRef(null);
  const [localLens, setLocalLens] = useState({ y: 0 });

  const containerWidth = isDesktop && basketItems?.length > 0 ? 240 : 520;
  const containerHeight = 560;

  const handleMove = (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();

    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    const lensY = Math.max(
      0,
      Math.min(y - LENS_HEIGHT / 2, rect.height - LENS_HEIGHT)
    );

    setLocalLens({ y: lensY });
    onMouseMove?.({ xPercent, yPercent });
  };

  return (
    <div
      style={{
        position: "relative",
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "0px",
        overflow: "visible",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={imageRef}
        onMouseMove={handleMove}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src={selectedImage}
          alt="Zoomable Product"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {isZoomVisible && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: `${localLens.y}px`,
              width: "100%",
              height: `${LENS_HEIGHT}px`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImageZoom1;