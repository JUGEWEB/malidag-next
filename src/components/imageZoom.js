"use client";

import React, { useState } from 'react';
import useScreenSize from "./useIsMobile";

const ImageZoom = ({ selectedImage, basketItems }) => {
  const [zoomedPosition, setZoomedPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);  // Track hover state
  const {isDesktop} = useScreenSize()

  const handleMouseMove = (e) => {
    const image = e.target;
    const { left, top, width, height } = image.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Calculate zoom position relative to the image
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    setZoomedPosition({ x: xPercent, y: yPercent });
  };

  const handleMouseEnter = () => {
    setIsHovered(true); // Set to true when mouse enters
  };

  const handleMouseLeave = () => {
    setIsHovered(false); // Set to false when mouse leaves
  };

  return (
    <div
      className="image-container"
      style={{ position: 'relative', width: isDesktop && basketItems.length>0 ? "400px" : "500px", height: '600px', display: "flex", justifyContent: "center" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}  // Set hover to true when mouse enters
      onMouseLeave={handleMouseLeave}  // Set hover to false when mouse leaves
    >
      {/* Show the original image if not hovered */}
      {!isHovered ? (
        <img
          src={selectedImage}
          alt="Zoomable Product"
          style={{ width: 'auto', height: '100%' }}
        />
      ) : (
        // Show the zoomed image when hovered
        <div
          className="zoomed-image"
          style={{
            position: 'relative',
            top: "50%",
            right: 0,
            transform: 'translateY(-50%)',
            width:  isDesktop && basketItems.length>0 ? "400px" : "500px",  // Adjust the zoom window size
            height: '600px',
            overflow: 'hidden',
            border: '2px solid #ccc',
          }}
        >
          {/* Zoomed-in image */}
          <img
            src={selectedImage}
            alt="Zoomed Portion"
            style={{
              position: 'absolute',
              left: `-${zoomedPosition.x}%`,
              top: `-${zoomedPosition.y}%`,
              width: '200%', // Ensure proper zoom scaling
              height: '200%', // Ensure proper zoom scaling
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
