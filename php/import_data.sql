-- Import sample data for photo gallery
USE photo_gallery;

-- Insert users
INSERT INTO users (id, name, password_hash, role, is_blocked, category) VALUES
('1', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', FALSE, 'other'),
('2', 'janka', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', FALSE, 'family'),
('3', 'pavel', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', TRUE, 'friend');

-- Insert albums
INSERT INTO albums (id, name, cover_path) VALUES
('1', 'Dovolená v Itálii', 'albums/italy/cover.jpg'),
('2', 'Hory 2023', 'albums/mountains/cover.jpg'),
('3', 'Rodinné oslavy', 'albums/family/cover.jpg'),
('4', 'Výlety po Česku', 'albums/czech/cover.jpg');

-- Insert photos
INSERT INTO photos (id, path, album_id, created_at) VALUES
('101', 'albums/italy/photo1.jpg', '1', '2023-08-10 10:00:00'),
('102', 'albums/italy/photo2.jpg', '1', '2023-08-12 15:30:00'),
('103', 'albums/italy/photo3.jpg', '1', '2023-08-11 12:00:00'),
('201', 'albums/mountains/photo1.jpg', '2', '2023-02-20 08:00:00'),
('202', 'albums/mountains/photo2.jpg', '2', '2023-02-22 18:00:00'),
('301', 'albums/family/photo1.jpg', '3', '2022-12-24 20:00:00'),
('401', 'albums/czech/photo1.jpg', '4', '2023-05-01 14:00:00'),
('402', 'albums/czech/photo2.jpg', '4', '2023-05-02 11:00:00');

-- Insert photo tags
INSERT INTO photo_tags (photo_id, tag) VALUES
('101', 'dovolená'), ('101', 'moře'), ('101', 'léto'),
('102', 'dovolená'), ('102', 'město'),
('103', 'dovolená'), ('103', 'příroda'), ('103', 'super fotka'),
('201', 'hory'), ('201', 'sníh'), ('201', 'zima'),
('202', 'hory'), ('202', 'výhled'),
('301', 'rodina'), ('301', 'oslava'),
('401', 'výlet'), ('401', 'příroda'),
('402', 'výlet'), ('402', 'z dálky');

-- Insert comments
INSERT INTO comments (id, photo_id, author, text, created_at, parent_id) VALUES
('c1', '101', 'janka', 'Nádherná fotka!', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
('c2', '101', 'admin', 'Děkuji, Jani!', DATE_SUB(NOW(), INTERVAL 21 HOUR), 'c1'),
('c3', '201', 'pavel', 'Super výhled.', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL);

-- Insert comment reactions
INSERT INTO comment_reactions (comment_id, emoji, user_id) VALUES
('c1', '👍', '2'),
('c1', '❤️', '1'),
('c3', '👍', '1');
