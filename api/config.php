<?php
// Error reporting - disable in production
error_reporting(0);
ini_set('display_errors', 0);

// CORS configuration
$allowed_origins = [
    'http://localhost:5173',  // Vue dev server
    'https://your-domain.com' // Your production domain
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Database configuration - use environment variables if available
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'event_management');

// Create database connection with error handling
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        // Set charset to utf8mb4
        $conn->set_charset("utf8mb4");
        
        return $conn;
    } catch (Exception $e) {
        // Log error but don't expose details to client
        error_log("Database connection error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database connection error']);
        exit();
    }
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Basic security functions
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d\TH:i:s.u\Z', $date);
    return $d && $d->format('Y-m-d\TH:i:s.u\Z') === $date;
} 