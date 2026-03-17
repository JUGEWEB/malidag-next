'use client';
import React from 'react';

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
  const mp4Fallback = src.replace(/\.webm$/i, '.mp4');

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isStandardWidth ? '300px' : '200px',
        cursor: 'pointer',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      {!isPlaying ? (
        <>
          <img
            src={cover}
            alt="Video Cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick();
            }}
            style={{
              position: 'absolute',
              top: '75px',
              right: isStandardWidth ? '100px' : '20px',
              transform: 'translate(-50%, -50%)',
               backgroundColor: '#00000099',
              color: 'white',
              border: '2px solid white',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              fontSize: '22px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 3,
            }}
          >
            ▶
          </button>
        </>
      ) : (
        <video
          key={src}
          muted
          playsInline
          autoPlay
          controls={false}
          preload="metadata"
          poster={cover}
          onEnded={() => {
            onVideoEnd?.();
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
            display: 'block',
          }}
        >
          <source src={src} type="video/webm" />
          <source src={mp4Fallback} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {overlay && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: isStandardWidth ? '100px' : '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            alignItems: 'start',
            color: 'white',
            textAlign: 'start',
            padding: '20px',
            pointerEvents: 'none',
            opacity: 1,
          }}
        >
          {overlay}
        </div>
      )}
    </div>
  );
};

export default SlideVideo;