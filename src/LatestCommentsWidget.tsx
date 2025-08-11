import React, { useState, useEffect } from 'react';
import { api } from './api.ts';
import type { Comment } from './types.ts';

interface LatestCommentsWidgetProps {
  isVisible: boolean;
  onOpenLightboxFromComment: (photoId: string) => void;
}

export const LatestCommentsWidget = ({ isVisible, onOpenLightboxFromComment }: LatestCommentsWidgetProps) => {
    const [latestComments, setLatestComments] = useState<Comment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isVisible) {
            const fetchComments = async () => {
                setLoading(true);
                try {
                    const comments = await api.getLatestComments(10);
                    setLatestComments(comments);
                    setError(null);
                } catch (e) {
                    console.error("Failed to fetch latest comments:", e);
                    setError("Nepodařilo se načíst komentáře.");
                } finally {
                    setLoading(false);
                }
            };
            
            fetchComments();
            const interval = setInterval(fetchComments, 30000); 
            return () => clearInterval(interval);
        }
    }, [isVisible]);

    return (
        <div className={`latest-comments-widget ${isVisible ? 'visible' : ''}`}>
            <h3>Nejnovější komentáře</h3>
            <div className="latest-comments-list">
                {loading && <div className="loader"></div>}
                {!loading && error && <p style={{padding: '1rem', color: 'var(--error-color)'}}>{error}</p>}
                {!loading && !error && latestComments.length === 0 && <p style={{padding: '1rem', color: 'var(--on-surface-color-secondary)'}}>Žádné komentáře k zobrazení.</p>}
                {!loading && !error && latestComments.map(comment => (
                    <div key={comment.id} className="latest-comment-item" onClick={() => onOpenLightboxFromComment(comment.photoId)}>
                        <div className="author">{comment.author}</div>
                        <div className="snippet">{comment.text}</div>
                        <div className="date">{new Date(comment.createdAt).toLocaleDateString('cs-CZ')}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
