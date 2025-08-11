import React, { useState, useEffect } from 'react';
import { api } from './api.ts';
import type { Album } from './types.ts';
import { LazyImage } from './LazyImage.tsx';

interface AlbumGridProps {
  navigateTo: (path: string) => void;
}

export const AlbumGrid = ({ navigateTo }: AlbumGridProps) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getAlbums()
      .then(setAlbums)
      .catch(() => setError('Nepodařilo se načíst alba.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"></div>;
  if (error) return <p className="error" style={{textAlign: 'center'}}>{error}</p>;

  return (
    <>
      <h1>Moje Alba</h1>
      <div className="grid-container">
        {albums.map(album => (
          <div key={album.id} className="grid-item" onClick={() => navigateTo(`/album/${album.id}`)}>
            <div className="grid-item-image-wrapper">
                <LazyImage src={album.cover} alt={album.name} />
            </div>
            <div className="grid-item-overlay">
                <span className="album-name">{album.name}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};