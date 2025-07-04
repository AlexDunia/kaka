<?php
require_once __DIR__ . '/../config/database.php';

class Blog {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function getAllPosts() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    bp.id,
                    bp.slug,
                    bp.title,
                    bp.author,
                    bp.author_image,
                    bp.date,
                    bp.created_at
                FROM blog_posts bp
                ORDER BY bp.date DESC
            ");
            
            $stmt->execute();
            $posts = $stmt->fetchAll();
            
            // Fetch content for each post
            foreach ($posts as &$post) {
                $post['content'] = $this->getPostContent($post['id']);
            }
            
            return $posts;
        } catch (PDOException $e) {
            error_log("Error fetching all posts: " . $e->getMessage());
            throw new Exception("Failed to fetch blog posts");
        }
    }
    
    public function getPostBySlug($slug) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    bp.id,
                    bp.slug,
                    bp.title,
                    bp.author,
                    bp.author_image,
                    bp.date,
                    bp.created_at
                FROM blog_posts bp
                WHERE bp.slug = :slug
                LIMIT 1
            ");
            
            $stmt->bindParam(':slug', $slug, PDO::PARAM_STR);
            $stmt->execute();
            
            $post = $stmt->fetch();
            if (!$post) {
                return null;
            }
            
            // Fetch content for the post
            $post['content'] = $this->getPostContent($post['id']);
            
            return $post;
        } catch (PDOException $e) {
            error_log("Error fetching post by slug: " . $e->getMessage());
            throw new Exception("Failed to fetch blog post");
        }
    }
    
    private function getPostContent($postId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    content_type as type,
                    content_text as content,
                    image_url as url,
                    image_alt as alt
                FROM blog_content
                WHERE blog_post_id = :post_id
                ORDER BY content_order ASC
            ");
            
            $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching post content: " . $e->getMessage());
            throw new Exception("Failed to fetch blog content");
        }
    }
} 