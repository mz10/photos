-- Database schema for photo gallery
CREATE DATABASE IF NOT EXISTS photo_gallery;
USE photo_gallery;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(20)
);

-- Albums table
CREATE TABLE albums (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cover_path VARCHAR(255)
);

-- Photos table
CREATE TABLE photos (
    id VARCHAR(36) PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    album_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- Photo tags (many-to-many relationship)
CREATE TABLE photo_tags (
    photo_id VARCHAR(36) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (photo_id, tag),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    author VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    parent_id VARCHAR(36),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Comment reactions
CREATE TABLE comment_reactions (
    comment_id VARCHAR(36) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (comment_id, emoji, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
