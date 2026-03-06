'use client';
import React from 'react';

const SlideOverlay = ({
  position = 'center',
  headline,
  sub,
  buttonText,
  onClick,
  dark = false,
}) => {
  // ✅ Alignment presets — top only
  const alignStyles = {
    left: {
      alignItems: 'flex-start',
      textAlign: 'left',
      paddingLeft: '8%',
    },
    center: {
      alignItems: 'center',
      textAlign: 'center',
    },
    right: {
      alignItems: 'flex-end',
      textAlign: 'right',
      paddingRight: '8%',
    },
  };

  return (
    <div
     onClick={onClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: "pointer",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // 👈 stays at top
        color: dark ? 'black' : 'white',
        textShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,0.5)',
        
        paddingTop: '5%',
        paddingBottom: '2%',
        paddingLeft: '5%',
        paddingRight: '5%',
        ...alignStyles[position],
      }}
    >
      {headline && (
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.3rem',
            maxWidth: '600px',
          }}
        >
          {headline}
        </h2>
      )}
      {sub && (
        <p
          style={{
            fontSize: '1rem',
            opacity: 0.9,
            maxWidth: '600px',
            marginBottom: '0.5rem',
          }}
        >
          {sub}
        </p>
      )}
      {buttonText && (
        <button
          onClick={onClick}
          style={{
            marginTop: '8px',
            backgroundColor: dark ? 'black' : 'white',
            color: dark ? 'white' : 'black',
            border: 'none',
            borderRadius: '25px',
            padding: '8px 20px',
            fontWeight: '600',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default SlideOverlay;
