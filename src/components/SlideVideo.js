"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SlideVideo = ({
  src,
  cover,
  onClick,
  onPlayClick,
  onVideoEnd,
  isStandardWidth,
  overlay,
  isPlaying,
}) => {
  const videoRef = useRef(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const isWebm = /\.webm(?:\?|$)/i.test(src);
  const mp4Fallback = isWebm
    ? src.replace(/\.webm(?=\?|$)/i, ".mp4")
    : null;

  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;

    const video = videoRef.current;

    video.currentTime = 0;

    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch((error) => {
        if (error.name !== "AbortError") {
          console.warn("Video autoplay blocked:", error);
        }
      });
    }
  }, [isPlaying, src]);

  const handlePlay = () => {
    setHasPlayed(true);
    onPlayClick?.();
  };

  const handleEnded = () => {
    setHasPlayed(true);
    onVideoEnd?.();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: isStandardWidth ? "300px" : "200px",
        cursor: "pointer",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
      onClick={onClick}
    >
      {!isPlaying ? (
        <>
          {cover && (
            <Image
              src={cover}
              alt="Video cover"
              fill
              sizes="100vw"
              style={{
                objectFit: "cover",
              }}
            />
          )}

          <button
            type="button"
            aria-label={hasPlayed ? "Replay video" : "Play video"}
            onClick={(event) => {
              event.stopPropagation();
              handlePlay();
            }}
            style={{
              position: "absolute",
              top: "50%",
              right: isStandardWidth ? "80px" : "20px",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "#fff",
              border: "2px solid rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              fontSize: "26px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            {hasPlayed ? "↻" : "▶"}
          </button>
        </>
      ) : (
        <video
          ref={videoRef}
          key={src}
          muted
          playsInline
          autoPlay
          controls={false}
          preload="metadata"
          poster={cover}
          onPlay={() => setHasPlayed(true)}
          onEnded={handleEnded}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            backgroundColor: "#000",
            display: "block",
          }}
        >
          <source
            src={src}
            type={isWebm ? "video/webm" : "video/mp4"}
          />

          {mp4Fallback && (
            <source src={mp4Fallback} type="video/mp4" />
          )}

          Your browser does not support the video tag.
        </video>
      )}

      {overlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: isStandardWidth ? "100px" : 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            color: "#fff",
            textAlign: "start",
            padding: "20px",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {overlay}
        </div>
      )}
    </div>
  );
};

export default SlideVideo;