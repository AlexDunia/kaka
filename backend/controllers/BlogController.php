<?php
require_once __DIR__ . '/../models/Blog.php';
require_once __DIR__ . '/../utils/Security.php';

class BlogController {
    private $blog;
    
    public function __construct() {
        $this->blog = new Blog();
    }
    
    public function getAllPosts() {
        try {
            $posts = $this->blog->getAllPosts();
            return [
                'status' => 'success',
                'data' => Security::sanitizeOutput($posts)
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to fetch blog posts'
            ];
        }
    }
    
    public function getPostBySlug($slug) {
        try {
            // Validate and sanitize input
            $slug = Security::validateInput($slug);
            
            if (empty($slug)) {
                return [
                    'status' => 'error',
                    'message' => 'Invalid slug provided'
                ];
            }
            
            $post = $this->blog->getPostBySlug($slug);
            
            if (!$post) {
                return [
                    'status' => 'error',
                    'message' => 'Post not found'
                ];
            }
            
            return [
                'status' => 'success',
                'data' => Security::sanitizeOutput($post)
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to fetch blog post'
            ];
        }
    }
} 