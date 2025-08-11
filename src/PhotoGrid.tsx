import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api.ts';
import type { Photo, Album } from './types.ts';
import { MultiTagFilter } from './MultiTagFilter.tsx';
import { LazyImage } from './LazyImage.tsx';

interface PhotoGridProps {
  albumId: string;
  navigateTo: (path: string) => void;
}

type SortOrder = 'newest' | 'oldest';

export const PhotoGrid = ({ albumId, navigateTo }: PhotoGridProps) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
        api.getPhotosForAlbum(albumId),
        api.getAlbum(albumId)
    ]).then(([albumPhotos, albumDetails]) => {
        setPhotos(albumPhotos);
        setAlbum(albumDetails || null);
    }).catch(() => {
        setError('Nepodařilo se načíst obsah alba.');
    }).finally(() => {
        setLoading(false);
    });
  }, [albumId]);

  const displayedPhotos = useMemo(() => {
    return photos
      .filter(photo => {
        if (selectedTags.length === 0) return true;
        return selectedTags.every(tag => photo.tags.includes(tag));
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [photos, sortOrder, selectedTags]);


  if (loading) return <div className="loader"></div>;
  if (error) return <p className="error" style={{textAlign: 'center'}}>{error}</p>;


  return (
    <>
      <div className="view-header">
          <button className="back-button" onClick={() => navigateTo('/')}>
              &larr; Zpět na alba
          </button>
          <h1 className="view-title">{album?.name || 'Album'}</h1>
          <button className="filter-toggle-button" onClick={() => setIsFilterVisible(!isFilterVisible)}>
              Filtrovat
          </button>
      </div>
      
      {isFilterVisible && (
          <div className="filter-controls">
              <div className="form-group tag-filter-group">
                  <label>Filtrovat podle štítků</label>
                  <MultiTagFilter
                      selectedTags={selectedTags}
                      onSelectedTagsChange={setSelectedTags}
                  />
              </div>
              <div className="form-group">
                  <label htmlFor="sort-order-select">Řadit podle</label>
                  <div className="select-wrapper">
                      <select
                          id="sort-order-select"
                          value={sortOrder}
                          onChange={e => setSortOrder(e.target.value as SortOrder)}
                      >
                          <option value="newest">Od nejnovějších</option>
                          <option value="oldest">Od nejstarších</option>
                      </select>
                  </div>
              </div>
          </div>
      )}
      <div className="grid-container">
        {displayedPhotos.map((photo, index) => (
          <div key={photo.id} className="grid-item" onClick={() => navigateTo(`/album/${albumId}/photo/${photo.id}`)}>
              <div className="grid-item-image-wrapper">
                  <LazyImage src={photo.url.replace('1920/1080', '800/600')} alt={`Photo ${index + 1}`} />
              </div>
          </div>
        ))}
      </div>
    </>
  );
};