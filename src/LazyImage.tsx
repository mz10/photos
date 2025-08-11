import React, { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
}

export const LazyImage = ({ src, alt }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="lazy-image-container">
      {!isLoaded && <div className="lazy-image-placeholder" />}
      <img
        src={src}
        alt={alt}
        className={isLoaded ? 'is-loaded' : ''}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};
