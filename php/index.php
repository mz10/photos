<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

class PhotoAPI {
    private $db;
    
    public function __construct() {
        $this->connectDB();
    }
    
    private function connectDB() {
        try {
            $this->db = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        } catch (PDOException $e) {
            $this->sendError(500, "Database connection failed: " . $e->getMessage());
        }
    }
    
    private function sendError($code, $message) {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit;
    }
    
    private function simulateLatency() {
        usleep(500000); // 500ms delay to match mock API
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $endpoint = str_replace('/api/', '', $path);
        
        try {
            switch ($endpoint) {
                case 'login':
                    if ($method === 'POST') return $this->login();
                    break;
                case 'users':
                    if ($method === 'GET') return $this->getUsers();
                    break;
                case 'albums':
                    if ($method === 'GET') return $this->getAlbums();
                    break;
                case 'album':
                    if ($method === 'GET') return $this->getAlbum();
                    break;
                case 'photos':
                    if ($method === 'GET') return $this->getPhotosForAlbum();
                    break;
                case 'photo':
                    if ($method === 'GET') return $this->getPhotoDetails();
                    break;
                case 'tags':
                    if ($method === 'GET') return $this->getAllTags();
                    break;
                case 'update-tags':
                    if ($method === 'POST') return $this->updatePhotoTags();
                    break;
                case 'comments':
                    if ($method === 'GET') return $this->getCommentsForPhoto();
                    break;
                case 'latest-comments':
                    if ($method === 'GET') return $this->getLatestComments();
                    break;
                case 'post-comment':
                    if ($method === 'POST') return $this->postComment();
                    break;
                case 'toggle-reaction':
                    if ($method === 'POST') return $this->toggleCommentReaction();
                    break;
                case 'delete-comment':
                    if ($method === 'POST') return $this->deleteComment();
                    break;
                case 'index':
                    if ($method === 'POST') return $this->indexPhotos();
                    break;
                default:
                    $this->sendError(404, 'Endpoint not found');
            }
        } catch (Exception $e) {
            $this->sendError(500, $e->getMessage());
        }
    }
    
    private function getUsers() {
        $this->simulateLatency();
        $stmt = $this->db->query(
            "SELECT id, name, role, is_blocked as isBlocked, category 
             FROM users ORDER BY name"
        );
        return json_encode($stmt->fetchAll());
    }
    
    private function updateUserStatus() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['userId']) || !isset($data['isBlocked'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        $stmt = $this->db->prepare(
            "UPDATE users SET is_blocked = ? WHERE id = ?"
        );
        $stmt->execute([$data['isBlocked'], $data['userId']]);
        
        return json_encode(['success' => true]);
    }
    
    private function updateUserCategory() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['userId']) || !isset($data['category'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        $stmt = $this->db->prepare(
            "UPDATE users SET category = ? WHERE id = ?"
        );
        $stmt->execute([$data['category'], $data['userId']]);
        
        return json_encode(['success' => true]);
    }
    
    private function login() {
        $this->simulateLatency();
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name']) || !isset($data['password'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        $stmt = $this->db->prepare(
            "SELECT id, name, password_hash, role, is_blocked, category 
             FROM users WHERE name = ?"
        );
        $stmt->execute([$data['name']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            return json_encode(null);
        }
        
        if ($user['is_blocked']) {
            $this->sendError(403, 'Váš účet je zablokovaný.');
        }
        
        return json_encode([
            'id' => $user['id'],
            'name' => $user['name'],
            'role' => $user['role'],
            'isBlocked' => (bool)$user['is_blocked'],
            'category' => $user['category']
        ]);
    }
    
    private function indexPhotos() {
        $this->simulateLatency();
        
        // Get all existing albums from DB
        $stmt = $this->db->query("SELECT id, name FROM albums");
        $existingAlbums = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Scan photo directory for albums
        $albumDirs = glob(PHOTO_BASE_DIR . '*', GLOB_ONLYDIR);
        $processedAlbums = [];
        
        foreach ($albumDirs as $albumDir) {
            $albumName = basename($albumDir);
            
            // Validate album name
            if (!preg_match(ALBUM_DIR_PATTERN, $albumName)) {
                continue;
            }
            
            // Find or create album in DB
            $albumId = array_search($albumName, $existingAlbums);
            if ($albumId === false) {
                $albumId = uniqid();
                $stmt = $this->db->prepare("INSERT INTO albums (id, name) VALUES (?, ?)");
                $stmt->execute([$albumId, $albumName]);
            }
            
            // Process photos in album
            $photoFiles = [];
            foreach (PHOTO_EXTENSIONS as $ext) {
                $photoFiles = array_merge($photoFiles, glob($albumDir . '/*.' . $ext));
            }
            
            // Get existing photos for this album
            $stmt = $this->db->prepare("SELECT id, path FROM photos WHERE album_id = ?");
            $stmt->execute([$albumId]);
            $existingPhotos = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            foreach ($photoFiles as $photoFile) {
                $photoPath = 'albums/' . $albumName . '/' . basename($photoFile);
                
                // Skip if photo already exists
                if (in_array($photoPath, $existingPhotos)) {
                    continue;
                }
                
                // Add new photo
                $photoId = uniqid();
                $createdAt = date('Y-m-d H:i:s', filemtime($photoFile));
                $stmt = $this->db->prepare(
                    "INSERT INTO photos (id, path, album_id, created_at) VALUES (?, ?, ?, ?)"
                );
                $stmt->execute([$photoId, $photoPath, $albumId, $createdAt]);
            }
            
            // Update album cover if none exists
            if (!empty($photoFiles)) {
                $stmt = $this->db->prepare(
                    "UPDATE albums SET cover_path = ? WHERE id = ? AND cover_path IS NULL"
                );
                $stmt->execute(['albums/' . $albumName . '/' . basename($photoFiles[0]), $albumId]);
            }
            
            $processedAlbums[] = $albumName;
        }
        
        return json_encode([
            'success' => true,
            'processed' => count($processedAlbums),
            'albums' => $processedAlbums
        ]);
    }
    
    private function getAlbums() {
        $this->simulateLatency();
        $stmt = $this->db->query("SELECT id, name, cover_path as cover FROM albums");
        return json_encode($stmt->fetchAll());
    }
    
    private function getAlbum() {
        $this->simulateLatency();
        $albumId = $_GET['id'] ?? null;
        if (!$albumId) {
            $this->sendError(400, 'Album ID is required');
        }
        
        $stmt = $this->db->prepare("SELECT id, name, cover_path as cover FROM albums WHERE id = ?");
        $stmt->execute([$albumId]);
        $album = $stmt->fetch();
        
        if (!$album) {
            $this->sendError(404, 'Album not found');
        }
        
        return json_encode($album);
    }
    
    private function getPhotosForAlbum() {
        $this->simulateLatency();
        $albumId = $_GET['albumId'] ?? null;
        if (!$albumId) {
            $this->sendError(400, 'Album ID is required');
        }
        
        $stmt = $this->db->prepare(
            "SELECT p.id, p.path as url, p.album_id as albumId, p.created_at as createdAt
             FROM photos p WHERE p.album_id = ?"
        );
        $stmt->execute([$albumId]);
        $photos = $stmt->fetchAll();
        
        // Get tags for each photo
        foreach ($photos as &$photo) {
            $stmt = $this->db->prepare(
                "SELECT tag FROM photo_tags WHERE photo_id = ?"
            );
            $stmt->execute([$photo['id']]);
            $tags = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            $photo['tags'] = $tags ?: [];
        }
        
        return json_encode($photos);
    }
    
    private function getPhotoDetails() {
        $this->simulateLatency();
        $photoId = $_GET['id'] ?? null;
        if (!$photoId) {
            $this->sendError(400, 'Photo ID is required');
        }
        
        $stmt = $this->db->prepare(
            "SELECT id, path as url, album_id as albumId, created_at as createdAt
             FROM photos WHERE id = ?"
        );
        $stmt->execute([$photoId]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            $this->sendError(404, 'Photo not found');
        }
        
        // Get tags
        $stmt = $this->db->prepare("SELECT tag FROM photo_tags WHERE photo_id = ?");
        $stmt->execute([$photoId]);
        $tags = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        $photo['tags'] = $tags ?: [];
        
        return json_encode($photo);
    }
    
    private function getAllTags() {
        $this->simulateLatency();
        $stmt = $this->db->query("SELECT DISTINCT tag FROM photo_tags ORDER BY tag");
        $tags = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        return json_encode($tags);
    }
    
    private function updatePhotoTags() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['photoId']) || !isset($data['tags'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        // Verify photo exists
        $stmt = $this->db->prepare("SELECT 1 FROM photos WHERE id = ?");
        $stmt->execute([$data['photoId']]);
        if (!$stmt->fetch()) {
            $this->sendError(404, 'Photo not found');
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Remove existing tags
            $stmt = $this->db->prepare("DELETE FROM photo_tags WHERE photo_id = ?");
            $stmt->execute([$data['photoId']]);
            
            // Add new tags
            if (!empty($data['tags'])) {
                $stmt = $this->db->prepare("INSERT INTO photo_tags (photo_id, tag) VALUES (?, ?)");
                foreach ($data['tags'] as $tag) {
                    $stmt->execute([$data['photoId'], $tag]);
                }
            }
            
            $this->db->commit();
            return json_encode(['success' => true]);
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->sendError(500, 'Failed to update tags');
        }
    }
    
    private function getCommentsForPhoto() {
        $this->simulateLatency();
        $photoId = $_GET['photoId'] ?? null;
        if (!$photoId) {
            $this->sendError(400, 'Photo ID is required');
        }
        
        $stmt = $this->db->prepare(
            "SELECT id, photo_id as photoId, author, text, created_at as createdAt, parent_id as parentId
             FROM comments WHERE photo_id = ? ORDER BY created_at"
        );
        $stmt->execute([$photoId]);
        $comments = $stmt->fetchAll();
        
        // Get reactions for each comment
        foreach ($comments as &$comment) {
            $stmt = $this->db->prepare(
                "SELECT emoji, GROUP_CONCAT(user_id) as users 
                 FROM comment_reactions WHERE comment_id = ? 
                 GROUP BY emoji"
            );
            $stmt->execute([$comment['id']]);
            $reactions = $stmt->fetchAll();
            
            $comment['reactions'] = [];
            foreach ($reactions as $reaction) {
                $comment['reactions'][$reaction['emoji']] = explode(',', $reaction['users']);
            }
        }
        
        return json_encode($comments);
    }
    
    private function getLatestComments() {
        $this->simulateLatency();
        $limit = min($_GET['limit'] ?? 5, 20); // Max 20 comments
        
        $stmt = $this->db->prepare(
            "SELECT id, photo_id as photoId, author, text, created_at as createdAt, parent_id as parentId
             FROM comments ORDER BY created_at DESC LIMIT ?"
        );
        $stmt->execute([$limit]);
        $comments = $stmt->fetchAll();
        
        // Get reactions for each comment
        foreach ($comments as &$comment) {
            $stmt = $this->db->prepare(
                "SELECT emoji, GROUP_CONCAT(user_id) as users 
                 FROM comment_reactions WHERE comment_id = ? 
                 GROUP BY emoji"
            );
            $stmt->execute([$comment['id']]);
            $reactions = $stmt->fetchAll();
            
            $comment['reactions'] = [];
            foreach ($reactions as $reaction) {
                $comment['reactions'][$reaction['emoji']] = explode(',', $reaction['users']);
            }
        }
        
        return json_encode($comments);
    }
    
    private function postComment() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['photoId']) || !isset($data['author']) || !isset($data['text'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        // Verify photo exists
        $stmt = $this->db->prepare("SELECT 1 FROM photos WHERE id = ?");
        $stmt->execute([$data['photoId']]);
        if (!$stmt->fetch()) {
            $this->sendError(404, 'Photo not found');
        }
        
        $commentId = uniqid();
        $createdAt = date('Y-m-d H:i:s');
        $parentId = $data['parentId'] ?? null;
        
        $stmt = $this->db->prepare(
            "INSERT INTO comments (id, photo_id, author, text, created_at, parent_id)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $commentId,
            $data['photoId'],
            $data['author'],
            $data['text'],
            $createdAt,
            $parentId
        ]);
        
        return json_encode([
            'id' => $commentId,
            'photoId' => $data['photoId'],
            'author' => $data['author'],
            'text' => $data['text'],
            'createdAt' => $createdAt,
            'parentId' => $parentId,
            'reactions' => []
        ]);
    }
    
    private function toggleCommentReaction() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['commentId']) || !isset($data['emoji']) || !isset($data['userId'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        // Check if reaction exists
        $stmt = $this->db->prepare(
            "SELECT 1 FROM comment_reactions 
             WHERE comment_id = ? AND emoji = ? AND user_id = ?"
        );
        $stmt->execute([$data['commentId'], $data['emoji'], $data['userId']]);
        
        if ($stmt->fetch()) {
            // Remove reaction
            $stmt = $this->db->prepare(
                "DELETE FROM comment_reactions 
                 WHERE comment_id = ? AND emoji = ? AND user_id = ?"
            );
            $stmt->execute([$data['commentId'], $data['emoji'], $data['userId']]);
        } else {
            // Add reaction
            $stmt = $this->db->prepare(
                "INSERT INTO comment_reactions (comment_id, emoji, user_id)
                 VALUES (?, ?, ?)"
            );
            $stmt->execute([$data['commentId'], $data['emoji'], $data['userId']]);
        }
        
        return json_encode(['success' => true]);
    }
    
    private function deleteComment() {
        $this->simulateLatency();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['commentId'])) {
            $this->sendError(400, 'Invalid request data');
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Get all comment IDs to delete (including children)
            $idsToDelete = [$data['commentId']];
            $queue = [$data['commentId']];
            
            while (!empty($queue)) {
                $currentId = array_shift($queue);
                $stmt = $this->db->prepare(
                    "SELECT id FROM comments WHERE parent_id = ?"
                );
                $stmt->execute([$currentId]);
                $children = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
                
                foreach ($children as $childId) {
                    if (!in_array($childId, $idsToDelete)) {
                        $idsToDelete[] = $childId;
                        $queue[] = $childId;
                    }
                }
            }
            
            // Delete reactions first
            $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));
            $stmt = $this->db->prepare(
                "DELETE FROM comment_reactions WHERE comment_id IN ($placeholders)"
            );
            $stmt->execute($idsToDelete);
            
            // Then delete comments
            $stmt = $this->db->prepare(
                "DELETE FROM comments WHERE id IN ($placeholders)"
            );
            $stmt->execute($idsToDelete);
            
            $this->db->commit();
            return json_encode(['success' => true]);
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->sendError(500, 'Failed to delete comment');
        }
    }
}

$api = new PhotoAPI();
$api->handleRequest();
