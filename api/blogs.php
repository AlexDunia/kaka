<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection
    $host = 'localhost';
    $port = 3307;
    $db   = 'events';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Get the URL path and extract slug
    $path = trim($_SERVER['REQUEST_URI'], '/');
    $parts = explode('/', $path);
    
    // Remove 'api' and 'blogs.php' from parts if they exist
    $parts = array_filter($parts, function($part) {
        return $part != 'api' && $part != 'blogs.php';
    });
    
    // Reset array keys and get the last part as slug
    $parts = array_values($parts);
    $slug = end($parts);

    error_log("Processing request with path: " . $path);
    error_log("Extracted slug: " . ($slug ?: 'none'));
    
    if (empty($slug)) {
        // Get all posts with first paragraph and author info
        $stmt = $pdo->query("
            SELECT 
                bp.id,
                bp.slug,
                bp.title,
                bp.seo_title,
                bp.seo_description,
                bp.bgimage,
                bp.bgimage_alt,
                DATE_FORMAT(bp.date, '%Y-%m-%d') as date,
                DATE_FORMAT(bp.last_modified, '%Y-%m-%d') as last_modified,
                bp.seo_keywords,
                ba.name as author_name,
                ba.display_name,
                ba.avatar_url,
                ba.role as author_role,
                (
                    SELECT 
                        JSON_OBJECT(
                            'type', content_type,
                            'content', content_text,
                            'url', image_url,
                            'alt', image_alt
                        )
                    FROM blog_content 
                    WHERE blog_post_id = bp.id 
                    AND content_type = 'paragraph'
                    ORDER BY content_order 
                    LIMIT 1
                ) as first_content
            FROM blog_posts bp
            LEFT JOIN blog_authors ba ON bp.author_id = ba.id
            ORDER BY bp.date DESC
        ");
        
        $posts = $stmt->fetchAll();
        
        // Format posts
        $formattedPosts = array_map(function($post) {
            $firstContent = json_decode($post['first_content'], true);
            unset($post['first_content']);
            
            // Format author info
            $author = [
                'name' => $post['author_name'],
                'display_name' => $post['display_name'] ?: $post['author_name'],
                'avatar_url' => $post['avatar_url'],
                'role' => $post['author_role']
            ];
            
            // Remove individual author fields
            unset($post['author_name'], $post['display_name'], $post['avatar_url'], $post['author_role']);
            
            // Ensure content is an array with at least the first paragraph
            $content = [];
            if ($firstContent) {
                $content[] = $firstContent;
            }
            
            return array_merge($post, [
                'author' => $author,
                'content' => $content
            ]);
        }, $posts);
        
        echo json_encode([
            'status' => 'success',
            'data' => $formattedPosts
        ], JSON_PRETTY_PRINT);
        
    } else {
        // Get single post with full author info
        error_log("Fetching post with slug: " . $slug);
        
        $stmt = $pdo->prepare("
            SELECT 
                bp.id,
                bp.slug,
                bp.title,
                bp.seo_title,
                bp.seo_description,
                bp.bgimage,
                bp.bgimage_alt,
                DATE_FORMAT(bp.date, '%Y-%m-%d') as date,
                DATE_FORMAT(bp.last_modified, '%Y-%m-%d') as last_modified,
                bp.seo_keywords,
                ba.name,
                ba.display_name,
                ba.avatar_url,
                ba.role,
                ba.bio,
                ba.social_links
            FROM blog_posts bp
            LEFT JOIN blog_authors ba ON bp.author_id = ba.id
            WHERE bp.slug = ?
        ");
        
        $stmt->execute([$slug]);
        $post = $stmt->fetch();
        
        if ($post) {
            error_log("Found post: " . $post['title']);
            
            // Format author info
            $author = [
                'name' => $post['name'],
                'display_name' => $post['display_name'] ?: $post['name'],
                'avatar_url' => $post['avatar_url'],
                'role' => $post['role'],
                'bio' => $post['bio'],
                'social_links' => json_decode($post['social_links'], true)
            ];
            
            // Remove individual author fields
            unset($post['name'], $post['display_name'], $post['avatar_url'], $post['role'], $post['bio'], $post['social_links']);
            
            // Add author info to post
            $post['author'] = $author;
            
            // Fetch all content sections
            $contentStmt = $pdo->prepare("
                SELECT 
                    content_type as type,
                    content_text as content,
                    image_url as url,
                    image_alt as alt,
                    content_order as `order`
                FROM blog_content 
                WHERE blog_post_id = ? 
                ORDER BY content_order ASC
            ");
            
            $contentStmt->execute([$post['id']]);
            $post['content'] = $contentStmt->fetchAll();
            
            // Remove internal ID from response
            unset($post['id']);
            
            echo json_encode([
                'status' => 'success',
                'data' => $post
            ], JSON_PRETTY_PRINT);
        } else {
            error_log("No post found with slug: " . $slug);
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Blog post not found'
            ], JSON_PRETTY_PRINT);
        }
    }
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error occurred'
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An unexpected error occurred'
    ], JSON_PRETTY_PRINT);
} 