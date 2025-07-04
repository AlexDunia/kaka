<?php
session_start();
require_once __DIR__ . '/../controllers/BlogController.php';
require_once __DIR__ . '/../utils/Security.php';

// Set security headers
Security::setSecurityHeaders();

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

try {
    $controller = new BlogController();
    
    // Parse the request path
    $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path_parts = explode('/', trim($request_uri, '/'));
    
    // Find the position of 'blog' in the path
    $blog_position = array_search('blog', $path_parts);
    if ($blog_position === false) {
        throw new Exception('Invalid endpoint');
    }
    
    // Get the parts after 'blog'
    $path_parts = array_slice($path_parts, $blog_position + 1);
    
    // Route the request
    if (empty($path_parts[0])) {
        // GET /api/blog - Get all posts
        $result = $controller->getAllPosts();
    } else {
        // GET /api/blog/{slug} - Get post by slug
        $result = $controller->getPostBySlug($path_parts[0]);
    }
    
    // Send the response
    http_response_code($result['status'] === 'success' ? 200 : 404);
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error'
    ]);
} 