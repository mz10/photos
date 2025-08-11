
export type User = {
  id: string;
  name: string;
  password_HACK: string; // Used for mock login
  role: 'admin' | 'user';
  isBlocked: boolean;
  category: 'family' | 'friend' | 'other';
};

export type Album = { 
  id: string; 
  name: string; 
  cover: string; 
};

export type Photo = { 
  id: string; 
  url: string; 
  description?: string;
  albumId: string;
  createdAt: string; // ISO date string
  tags: string[];
};

export type Comment = { 
  id: string; 
  photoId: string; 
  author: string; 
  text: string; 
  createdAt: string; // ISO date string
  parentId?: string; // For comment replies
  reactions: Record<string, string[]>; // emoji -> userIds
};