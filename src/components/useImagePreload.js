"use client"

import { useState, useEffect } from 'react';

const useImagePreload = (url) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    const img = new Image();
    img.src = url;
    img.onload = () => setLoaded(true);
  }, [url]);

  return loaded;
};

export default useImagePreload;
