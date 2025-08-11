import type { Album, Photo, Comment, User } from './types.ts';

// --- MOCK DATA ---
let users: User[] = [
  { id: '1', name: 'admin', password_HACK: 'admin123', role: 'admin', isBlocked: false, category: 'other' },
  { id: '2', name: 'janka', password_HACK: 'heslo', role: 'user', isBlocked: false, category: 'family' },
  { id: '3', name: 'pavel', password_HACK: 'heslo', role: 'user', isBlocked: true, category: 'friend' },
];

let albums: Album[] = [
  { id: '1', name: 'Dovolená v Itálii', cover: 'https://picsum.photos/id/1015/800/600' },
  { id: '2', name: 'Hory 2023', cover: 'https://picsum.photos/id/1043/800/600' },
  { id: '3', name: 'Rodinné oslavy', cover: 'https://picsum.photos/id/219/800/600' },
  { id: '4', name: 'Výlety po Česku', cover: 'https://picsum.photos/id/10/800/600' },
];

let photos: Photo[] = [
  { id: '101', url: 'https://picsum.photos/id/1015/1920/1080', albumId: '1', createdAt: '2023-08-10T10:00:00Z', tags: ['dovolená', 'moře', 'léto'] },
  { id: '102', url: 'https://picsum.photos/id/1016/1920/1080', albumId: '1', createdAt: '2023-08-12T15:30:00Z', tags: ['dovolená', 'město'] },
  { id: '103', url: 'https://picsum.photos/id/1018/1920/1080', albumId: '1', createdAt: '2023-08-11T12:00:00Z', tags: ['dovolená', 'příroda', 'super fotka'] },
  { id: '201', url: 'https://picsum.photos/id/1043/1920/1080', albumId: '2', createdAt: '2023-02-20T08:00:00Z', tags: ['hory', 'sníh', 'zima'] },
  { id: '202', url: 'https://picsum.photos/id/1044/1920/1080', albumId: '2', createdAt: '2023-02-22T18:00:00Z', tags: ['hory', 'výhled'] },
  { id: '301', url: 'https://picsum.photos/id/219/1920/1080', albumId: '3', createdAt: '2022-12-24T20:00:00Z', tags: ['rodina', 'oslava'] },
  { id: '401', url: 'https://picsum.photos/id/10/1920/1080', albumId: '4', createdAt: '2023-05-01T14:00:00Z', tags: ['výlet', 'příroda'] },
  { id: '402', url: 'https://picsum.photos/id/11/1920/1080', albumId: '4', createdAt: '2023-05-02T11:00:00Z', tags: ['výlet', 'z dálky'] },
];

let comments: Comment[] = [
  { 
    id: 'c1', 
    photoId: '101', 
    author: 'janka', 
    text: 'Nádherná fotka!', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    reactions: {'👍': ['2'], '❤️': ['1']} 
  },
  { 
    id: 'c2', 
    photoId: '101', 
    author: 'admin', 
    text: 'Děkuji, Jani!', 
    createdAt: new Date(Date.now() - 76400000).toISOString(), 
    parentId: 'c1', 
    reactions: {} 
  },
  { 
    id: 'c3', 
    photoId: '201', 
    author: 'pavel', 
    text: 'Super výhled.', 
    createdAt: new Date(Date.now() - 3600000).toISOString(), 
    reactions: {'👍': ['1']} 
  },
];

// NEW: Central "database" for all tags
const allTags: Set<string> = new Set(photos.flatMap(p => p.tags));

const MOCK_API_LATENCY = 500;

const findAlbumByPhotoId = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    return photo ? albums.find(a => a.id === photo.albumId) : undefined;
};


// --- MOCK API IMPLEMENTATION ---
export const api = {
  login: (name: string, password: string): Promise<User | null> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(u => u.name === name && u.password_HACK === password);
        if (user) {
          if (user.isBlocked) {
            reject(new Error('Váš účet je zablokovaný.'));
          } else {
            resolve(user);
          }
        } else {
          // In a real API, you'd reject here, but for the login form logic, resolving null is expected for "not found"
          resolve(null);
        }
      }, MOCK_API_LATENCY);
    });
  },

  getUsers: (): Promise<User[]> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(users))), MOCK_API_LATENCY));
  },

  updateUserStatus: (userId: string, isBlocked: boolean): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        users = users.map(u => (u.id === userId ? { ...u, isBlocked } : u));
        resolve();
      }, MOCK_API_LATENCY);
    });
  },

  updateUserCategory: (userId: string, category: User['category']): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            users = users.map(u => u.id === userId ? { ...u, category } : u);
            resolve();
        }, MOCK_API_LATENCY);
    });
  },

  getAlbums: (): Promise<Album[]> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(albums))), MOCK_API_LATENCY));
  },
  
  getAlbum: (albumId: string): Promise<Album | undefined> => {
      return new Promise(resolve => {
          const album = albums.find(a => a.id === albumId);
          setTimeout(() => resolve(album ? JSON.parse(JSON.stringify(album)) : undefined), MOCK_API_LATENCY / 2);
      });
  },

  getPhotosForAlbum: (albumId: string): Promise<Photo[]> => {
    return new Promise(resolve => {
      const albumPhotos = photos.filter(p => p.albumId === albumId);
      setTimeout(() => resolve(JSON.parse(JSON.stringify(albumPhotos))), MOCK_API_LATENCY);
    });
  },
  
  getPhotoDetails: (photoId: string): Promise<Photo | undefined> => {
      return new Promise(resolve => {
          const photo = photos.find(p => p.id === photoId);
          setTimeout(() => resolve(photo ? JSON.parse(JSON.stringify(photo)) : undefined), MOCK_API_LATENCY / 2);
      });
  },

  getAllTags: (): Promise<string[]> => {
      return new Promise(resolve => {
          setTimeout(() => resolve(Array.from(allTags).sort()), MOCK_API_LATENCY / 2);
      });
  },

  updatePhotoTags: (photoId: string, tags: string[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const photoIndex = photos.findIndex(p => p.id === photoId);
          if (photoIndex > -1) {
            photos[photoIndex].tags = tags;
            // Add any new tags to our central database
            tags.forEach(tag => allTags.add(tag));
            resolve();
          } else {
            reject(new Error("Photo not found"));
          }
        }, MOCK_API_LATENCY / 2);
      });
  },

  getCommentsForPhoto: (photoId: string): Promise<Comment[]> => {
    return new Promise(resolve => {
      const photoComments = comments.filter(c => c.photoId === photoId);
      setTimeout(() => resolve(JSON.parse(JSON.stringify(photoComments))), MOCK_API_LATENCY);
    });
  },
  
  getLatestComments: (limit: number): Promise<Comment[]> => {
      return new Promise(resolve => {
          const sortedComments = [...comments]
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTimeout(() => resolve(JSON.parse(JSON.stringify(sortedComments.slice(0, limit)))), MOCK_API_LATENCY);
      });
  },

  postComment: (photoId: string, author: string, text: string, parentId?: string): Promise<Comment> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newComment: Comment = {
          id: `c${Date.now()}`,
          photoId,
          author,
          text,
          parentId,
          createdAt: new Date().toISOString(),
          reactions: {},
        };
        comments.push(newComment);
        resolve(JSON.parse(JSON.stringify(newComment)));
      }, MOCK_API_LATENCY);
    });
  },

  toggleCommentReaction: (commentId: string, emoji: string, userId: string): Promise<void> => {
      return new Promise(resolve => {
        setTimeout(() => {
            const comment = comments.find(c => c.id === commentId);
            if (comment) {
                if (!comment.reactions) {
                    comment.reactions = {};
                }
                if (!comment.reactions[emoji]) {
                    comment.reactions[emoji] = [];
                }
                const userIndex = comment.reactions[emoji].indexOf(userId);
                if (userIndex > -1) {
                    comment.reactions[emoji].splice(userIndex, 1);
                } else {
                    comment.reactions[emoji].push(userId);
                }
            }
            resolve();
        }, MOCK_API_LATENCY / 2); // Faster for better UX
      });
  },

  deleteComment: (commentId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if (commentIndex === -1) {
                return reject(new Error("Comment not found"));
            }

            const idsToDelete = new Set<string>();
            const queue = [commentId];
            idsToDelete.add(commentId);

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = comments.filter(c => c.parentId === currentId);
                for (const child of children) {
                    if (!idsToDelete.has(child.id)) {
                        idsToDelete.add(child.id);
                        queue.push(child.id);
                    }
                }
            }

            comments = comments.filter(c => !idsToDelete.has(c.id));
            resolve();
        }, MOCK_API_LATENCY);
    });
  },
};