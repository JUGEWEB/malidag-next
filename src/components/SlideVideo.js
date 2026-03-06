'use client';
import React, { useState, useEffect } from 'react';

const SlideVideo = ({ src, cover, onClick, isStandardWidth, videoRefs, overlay }) => {
  const [ended, setEnded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
 const mp4Fallback = src.replace(/\.webm$/i, '.mp4');

  useEffect(() => {
    const vid = videoRefs?.current?.[src];
    if (vid && loaded) {
      vid.currentTime = 0;
      vid.play().catch(() => {
        console.warn('Autoplay might be blocked.');
      });
    }
  }, [restartKey, loaded, src, videoRefs]);

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
    >
      {!ended ? (
         <video
          ref={(el) => {
            if (el) videoRefs.current[src] = el;
            else delete videoRefs.current[src];
          }}
          key={restartKey}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={cover}
          onCanPlayThrough={(e) => {
            setLoaded(true);
            e.target.play().catch(() => {});
          }}
          onEnded={() => setEnded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '0px',
            backgroundColor: '#000',
            transition: 'opacity 0.5s ease-in-out',
            opacity: loaded ? 1 : 0,
          }}
        >
          {/* ✅ Fallback Sources */}
          <source src={src} type="video/webm" />
          <source src={mp4Fallback} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <>
          <img
            src={cover}
            alt="Video Cover"
            onClick={onClick}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '0px',
              display: 'block',
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEnded(false);
              setRestartKey((k) => k + 1);
              const vid = videoRefs.current[src];
              if (vid) {
                vid.load();
                vid.play().catch(() => {});
              }
            }}
            style={{
              position: 'absolute',
              top: '75px',
              right: isStandardWidth ? '100px' : "20px",
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
            }}
          >
            ▶
          </button>
        </>
      )}

      {/* ✨ Overlay Content */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: isStandardWidth ? '100px': "0",
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            alignItems: 'start',
            color: 'white',
            textAlign: 'start',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
            padding: '20px',
            pointerEvents: 'none', // let clicks pass through
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
