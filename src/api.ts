import type { Album, Photo, Comment, User } from './types.ts';

const API_BASE = '/api';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

export const api = {
  login: (name: string, password: string): Promise<User | null> => {
    return apiFetch('login', {
      method: 'POST',
      body: JSON.stringify({ name, password })
    }).catch(() => null); // Return null for failed login
  },

  getUsers: (): Promise<User[]> => {
    return apiFetch('users');
  },

  updateUserStatus: (userId: string, isBlocked: boolean): Promise<void> => {
    return apiFetch('update-user-status', {
      method: 'POST',
      body: JSON.stringify({ userId, isBlocked })
    });
  },

  updateUserCategory: (userId: string, category: User['category']): Promise<void> => {
    return apiFetch('update-user-category', {
      method: 'POST',
      body: JSON.stringify({ userId, category })
    });
  },

  getAlbums: (): Promise<Album[]> => {
    return apiFetch('albums');
  },
  
  getAlbum: (albumId: string): Promise<Album | undefined> => {
    return apiFetch(`album?id=${albumId}`).catch(() => undefined);
  },

  getPhotosForAlbum: (albumId: string): Promise<Photo[]> => {
    return apiFetch(`photos?albumId=${albumId}`);
  },
  
  getPhotoDetails: (photoId: string): Promise<Photo | undefined> => {
    return apiFetch(`photo?id=${photoId}`).catch(() => undefined);
  },

  getAllTags: (): Promise<string[]> => {
    return apiFetch('tags');
  },

  updatePhotoTags: (photoId: string, tags: string[]): Promise<void> => {
    return apiFetch('update-tags', {
      method: 'POST',
      body: JSON.stringify({ photoId, tags })
    });
  },

  getCommentsForPhoto: (photoId: string): Promise<Comment[]> => {
    return apiFetch(`comments?photoId=${photoId}`);
  },
  
  getLatestComments: (limit: number): Promise<Comment[]> => {
    return apiFetch(`latest-comments?limit=${limit}`);
  },

  postComment: (photoId: string, author: string, text: string, parentId?: string): Promise<Comment> => {
    return apiFetch('post-comment', {
      method: 'POST',
      body: JSON.stringify({ photoId, author, text, parentId })
    });
  },

  toggleCommentReaction: (commentId: string, emoji: string, userId: string): Promise<void> => {
    return apiFetch('toggle-reaction', {
      method: 'POST',
      body: JSON.stringify({ commentId, emoji, userId })
    });
  },

  deleteComment: (commentId: string): Promise<void> => {
    return apiFetch('delete-comment', {
      method: 'POST',
      body: JSON.stringify({ commentId })
    });
  },
};
