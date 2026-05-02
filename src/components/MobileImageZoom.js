"use client";

import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MobileImageZoom = ({ selectedImage, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2,
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          fontSize: 24,
        }}
      >
        ×
      </button>

      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        wheel={{ disabled: true }}
        doubleClick={{ mode: "toggle" }}
        pinch={{ disabled: false }}
        panning={{ disabled: false }}
      >
        <TransformComponent
          wrapperStyle={{
            width: "100vw",
            height: "100vh",
          }}
          contentStyle={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={selectedImage}
            alt="Zoomed product"
            style={{
              maxWidth: "100vw",
              maxHeight: "100vh",
              objectFit: "contain",
              touchAction: "none",
              userSelect: "none",
            }}
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MobileImageZoom;