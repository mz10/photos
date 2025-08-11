import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from './api.ts';
import type { Photo, Comment, User } from './types.ts';
import { useJxlDecoder } from './useJxlDecoder.ts';

interface LightboxProps {
  albumId: string;
  photoId: string;
  navigateTo: (path: string) => void;
  currentUser: User;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

const buildCommentTree = (comments: Comment[]): CommentWithReplies[] => {
    const commentsMap: Record<string, CommentWithReplies> = {};
    const rootComments: CommentWithReplies[] = [];

    comments.forEach(comment => {
        commentsMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
        if (comment.parentId && commentsMap[comment.parentId]) {
            commentsMap[comment.parentId].replies.push(commentsMap[comment.id]);
        } else {
            rootComments.push(commentsMap[comment.id]);
        }
    });

    return rootComments;
};

// Tags Manager Component
const TagsManager = ({ photo, onTagsUpdate }: { photo: Photo, onTagsUpdate: (newTags: string[]) => void }) => {
    const [tagInput, setTagInput] = useState('');
    const [allTags, setAllTags] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.getAllTags().then(setAllTags);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTagInput(value);

        if (value.trim()) {
            const filtered = allTags.filter(tag => 
                tag.toLowerCase().includes(value.toLowerCase()) && !photo.tags.includes(tag)
            );
            setSuggestions(filtered.slice(0, 5)); // Limit suggestions
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleAddTag = (tagToAdd: string) => {
        const newTag = tagToAdd.trim().toLowerCase();
        if (newTag && !photo.tags.includes(newTag)) {
            onTagsUpdate([...photo.tags, newTag]);
        }
        setTagInput('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput) {
            e.preventDefault();
            const tagToAdd = suggestions.length > 0 ? suggestions[0] : tagInput;
            handleAddTag(tagToAdd);
        }
    };
    
    const handleRemoveTag = (tagToRemove: string) => {
        onTagsUpdate(photo.tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="tags-manager" ref={wrapperRef}>
            <h4>Štítky</h4>
            <div className="tags-list">
                {photo.tags.map(tag => (
                    <span key={tag} className="tag-badge">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>&times;</button>
                    </span>
                ))}
            </div>
            <div className="tag-input-wrapper">
                <input
                    type="text"
                    className="tag-input"
                    placeholder="Přidat štítek..."
                    value={tagInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputChange}
                />
                <button onClick={() => handleAddTag(tagInput)} disabled={!tagInput}>+</button>
                 {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                        {suggestions.map(suggestion => (
                            <li 
                                key={suggestion}
                                onClick={() => handleAddTag(suggestion)}
                                className="suggestion-item"
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


// Comment Component
const CommentItem = ({ 
    comment, 
    onReply, 
    replyingToId, 
    onPostReply,
    onToggleReaction,
    onDeleteComment,
    currentUser,
}: { 
    comment: CommentWithReplies; 
    onReply: (id: string | null) => void;
    replyingToId: string | null;
    onPostReply: (text: string, parentId: string) => void;
    onToggleReaction: (commentId: string, emoji: string) => void;
    onDeleteComment: (commentId: string) => void;
    currentUser: User;
}) => {
    const [replyText, setReplyText] = useState("");
    const isReplying = replyingToId === comment.id;
    const canDelete = currentUser.role === 'admin' || currentUser.name === comment.author;

    const handlePostReply = () => {
        if (!replyText.trim()) return;
        onPostReply(replyText, comment.id);
        setReplyText("");
        onReply(null); // Close reply form after posting
    };

    return (
        <div className={`comment ${comment.parentId ? 'is-reply' : ''}`}>
            <div className="comment-header">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-date">
                    {new Date(comment.createdAt).toLocaleString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <p className="comment-body">{comment.text}</p>
            <div className="comment-footer">
                <div className="comment-actions">
                    <button onClick={() => onReply(isReplying ? null : comment.id)}>
                        {isReplying ? 'Zrušit' : 'Odpovědět'}
                    </button>
                    {canDelete && (
                        <button className="delete-comment-button" onClick={() => onDeleteComment(comment.id)}>
                            Smazat
                        </button>
                    )}
                </div>
                <div className="comment-reactions">
                    {AVAILABLE_REACTIONS.map(emoji => {
                        const userHasReacted = comment.reactions?.[emoji]?.includes(currentUser.id);
                        const count = comment.reactions?.[emoji]?.length || 0;
                        return (
                            <button 
                                key={emoji} 
                                className={`reaction-button ${userHasReacted ? 'active' : ''}`}
                                onClick={() => onToggleReaction(comment.id, emoji)}
                            >
                                {emoji} {count > 0 && <span className="reaction-count">{count}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {isReplying && (
                <div className="reply-form">
                    <textarea 
                        className="comment-input"
                        value={replyText} 
                        onChange={e => setReplyText(e.target.value)} 
                        placeholder={`Odpověď pro ${comment.author}...`}
                        rows={2}
                        autoFocus
                    />
                    <button className="submit-button" onClick={handlePostReply}>Odeslat odpověď</button>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="comment-replies">
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            onReply={onReply}
                            replyingToId={replyingToId}
                            onPostReply={onPostReply}
                            onToggleReaction={onToggleReaction}
                            onDeleteComment={onDeleteComment}
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const Lightbox = ({ albumId, photoId, navigateTo, currentUser }: LightboxProps) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [mainComment, setMainComment] = useState("");
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
    const [commentsError, setCommentsError] = useState<string | null>(null);

    const currentIndex = useMemo(() => photos.findIndex(p => p.id === photoId), [photos, photoId]);
    const currentPhoto = photos[currentIndex];
    const { decodedUrl, isLoading: isLoadingImage, error: imageError } = useJxlDecoder(currentPhoto?.url);
    
    const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

    const handleClose = () => navigateTo(`/album/${albumId}`);

    const fetchComments = useCallback(async (id: string) => {
        setCommentsError(null);
        try {
            const fetchedComments = await api.getCommentsForPhoto(id);
            setComments(fetchedComments);
        } catch (e) {
            console.error("Failed to fetch comments", e);
            setCommentsError("Nepodařilo se načíst komentáře.");
        }
    }, []);

    useEffect(() => {
        if (albumId) {
            setIsLoadingPhotos(true);
            api.getPhotosForAlbum(albumId)
                .then(setPhotos)
                .catch(err => {
                    console.error("Failed to fetch photos for lightbox", err);
                })
                .finally(() => setIsLoadingPhotos(false));
        }
    }, [albumId]);

    useEffect(() => {
        if (currentPhoto) {
            fetchComments(currentPhoto.id);
            setMainComment("");
            setReplyingToCommentId(null);
        }
    }, [currentPhoto, fetchComments]);
    
    const changePhoto = useCallback((direction: 'next' | 'prev') => {
        if (!photos.length) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < photos.length) {
            navigateTo(`/album/${albumId}/photo/${photos[newIndex].id}`);
        }
    }, [photos, currentIndex, albumId, navigateTo]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement || activeElement instanceof HTMLButtonElement) return;
        if (e.key === 'ArrowRight') changePhoto('next');
        if (e.key === 'ArrowLeft') changePhoto('prev');
        if (e.key === 'Escape') handleClose();
    }, [changePhoto, handleClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const handlePostComment = async (text: string, parentId?: string) => {
        if (!text.trim() || !currentPhoto) return;
        try {
            await api.postComment(currentPhoto.id, currentUser.name, text, parentId);
            fetchComments(currentPhoto.id);
            if(!parentId) {
                setMainComment("");
            }
        } catch(e) {
            console.error("Failed to post comment", e);
            alert("Komentář se nepodařilo odeslat. Zkuste to prosím znovu.");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!currentPhoto) return;
        const confirmation = window.confirm(
            "Opravdu chcete smazat tento komentář? Tato akce smaže i všechny související odpovědi."
        );
        if (confirmation) {
            try {
                await api.deleteComment(commentId);
                fetchComments(currentPhoto.id);
            } catch (e) {
                console.error("Failed to delete comment", e);
                alert("Komentář se nepodařilo smazat.");
            }
        }
    };

    const handleUpdateTags = async (newTags: string[]) => {
        if (!currentPhoto) return;

        const originalPhoto = { ...currentPhoto };
        const updatedPhoto = { ...currentPhoto, tags: newTags };

        // Optimistic update
        setPhotos(currentPhotos => currentPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));

        try {
            await api.updatePhotoTags(currentPhoto.id, newTags);
        } catch (e) {
            console.error("Failed to update tags", e);
            // Revert on failure
            setPhotos(currentPhotos => currentPhotos.map(p => p.id === originalPhoto.id ? originalPhoto : p));
            alert("Nepodařilo se uložit štítky.");
        }
    };
    
    const handleToggleReaction = async (commentId: string, emoji: string) => {
        const originalComments = [...comments];
        // Optimistic update
        setComments(currentComments => {
            return currentComments.map(c => {
                if (c.id === commentId) {
                    const newReactions = { ...(c.reactions || {}) };
                    const users = newReactions[emoji] || [];
                    const userIndex = users.indexOf(currentUser.id);
                    if (userIndex > -1) {
                        users.splice(userIndex, 1);
                    } else {
                        users.push(currentUser.id);
                    }
                    newReactions[emoji] = users;
                    return { ...c, reactions: newReactions };
                }
                return c;
            });
        });

        try {
            await api.toggleCommentReaction(commentId, emoji, currentUser.id);
        } catch (e) {
            console.error("Failed to toggle reaction", e);
            setComments(originalComments); // Revert on failure
            alert("Akce se nezdařila.");
        }
    };


    if (isLoadingPhotos) {
      return (
        <div className="lightbox-backdrop">
            <div className="loader"></div>
        </div>
      );
    }
    
    if (!currentPhoto || !albumId) return null;

    return (
        <div className="lightbox-backdrop" onClick={handleClose}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                
                <div className="lightbox-photo-container">
                    <div className="lightbox-image-wrapper">
                        {isLoadingImage && <div className="loader"></div>}
                        {imageError && !isLoadingImage && <p className="error">{imageError}</p>}
                        {decodedUrl && !imageError && <img src={decodedUrl} alt="Lightbox view" style={{ visibility: isLoadingImage ? 'hidden' : 'visible' }} />}
                    </div>
                </div>

                {currentIndex > 0 && <div className="lightbox-nav prev" onClick={() => changePhoto('prev')}>&#10094;</div>}
                {currentIndex < photos.length - 1 &&<div className="lightbox-nav next" onClick={() => changePhoto('next')}>&#10095;</div>}
                <div className="lightbox-nav close" onClick={handleClose}>&times;</div>


                <div className="comments-panel">
                    <TagsManager photo={currentPhoto} onTagsUpdate={handleUpdateTags} />
                    <h3>Komentáře</h3>
                    <div className="comments-list">
                        {commentsError && <p className="error" style={{padding: '0 0 1rem'}}>{commentsError}</p>}
                        {!commentsError && commentTree.length > 0 ? commentTree.map(c => (
                            <CommentItem 
                                key={c.id} 
                                comment={c}
                                onReply={setReplyingToCommentId}
                                replyingToId={replyingToCommentId}
                                onPostReply={handlePostComment}
                                onToggleReaction={handleToggleReaction}
                                onDeleteComment={handleDeleteComment}
                                currentUser={currentUser}
                            />
                        )) : !commentsError && <p>Žádné komentáře.</p>}
                    </div>
                    <div className="comment-form">
                        <textarea className="comment-input" value={mainComment} onChange={e => setMainComment(e.target.value)} placeholder="Přidat hlavní komentář..."></textarea>
                        <button className="submit-button" onClick={() => handlePostComment(mainComment)}>Odeslat</button>
                    </div>
                </div>
            </div>
        </div>
    );
};