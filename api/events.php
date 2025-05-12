<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('X-Content-Type-Options: nosniff'); // Prevent MIME type sniffing
header('X-Frame-Options: DENY'); // Prevent clickjacking
header('X-XSS-Protection: 1; mode=block'); // Enable XSS protection
header('Strict-Transport-Security: max-age=31536000; includeSubDomains'); // HSTS

// Production security settings 
if (!isset($_SERVER['HTTP_X_FORWARDED_PROTO']) || $_SERVER['HTTP_X_FORWARDED_PROTO'] !== 'https') {
    // Disable for local dev, but enable in production
    // header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    // exit;
}

// Function to sanitize strings
function sanitizeInput($input) {
    if (is_string($input)) {
        $input = trim($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        return $input;
    } elseif (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = sanitizeInput($value);
        }
        return $input;
    }
    return $input;
}

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 0); // Set to 0 in production
error_reporting(E_ALL);

// Rate limiting implementation
$rateLimitWindow = 60; // 1 minute window
$rateMaxRequests = 60; // Max 60 requests per minute
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// In production, you'd use Redis or Memcached for rate limiting
// This is a simple file-based implementation for demonstration
$rateLimitFile = sys_get_temp_dir() . '/rate_limits.json';
$rateLimits = file_exists($rateLimitFile) ? json_decode(file_get_contents($rateLimitFile), true) : [];

$now = time();
// Clean up expired entries
foreach ($rateLimits as $ip => $data) {
    if ($data['window'] < ($now - $rateLimitWindow)) {
        unset($rateLimits[$ip]);
    }
}

// Check if current IP is rate limited
if (isset($rateLimits[$clientIP])) {
    if ($rateLimits[$clientIP]['count'] >= $rateMaxRequests) {
        http_response_code(429); // Too Many Requests
        echo json_encode(['error' => 'Rate limit exceeded. Please try again later.']);
        exit;
    }
    $rateLimits[$clientIP]['count']++;
} else {
    $rateLimits[$clientIP] = [
        'window' => $now,
        'count' => 1
    ];
}

// Save updated rate limits
file_put_contents($rateLimitFile, json_encode($rateLimits));

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validate request method security
$allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

// Database config
$host = 'localhost';
$port = 3307; // You're using MySQL on port 3307
$db   = 'events';
$user = 'root';
$pass = ''; // Add your actual password here if any
$charset = 'utf8mb4';

// Try to load external config if exists
if (file_exists(__DIR__ . '/db_config.php')) {
    include_once(__DIR__ . '/db_config.php');
    if (function_exists('getDbConnection')) {
        error_log("Using external database configuration from db_config.php");
        $pdo = getDbConnection();
        // Verify connection
        if ($pdo === null) {
            throw new Exception("Failed to connect to database using db_config.php");
        }
    } else {
        error_log("db_config.php exists but getDbConnection() function not found, using local config");
        // Use the variables from db_config if available
        if (isset($db_name)) $db = $db_name;
        if (isset($db_user)) $user = $db_user;
        if (isset($db_pass)) $pass = $db_pass;
        if (isset($db_host)) $host = $db_host;
    }
}

// Log DB Connection parameters (be careful in production)
error_log("DB Connection params: host=$host, port=$port, db=$db, user=$user");

// Configure secure database connection options
$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    PDO::ATTR_STRINGIFY_FETCHES  => false
];

try {
    // Log the connection attempt (use a dedicated log file in production)
    error_log("Attempting database connection to $dsn");
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->setAttribute(PDO::ATTR_TIMEOUT, 5); // Connection timeout in seconds
    error_log("Database connection successful");
    
    // Verify database connection with a simple query
    $testStmt = $pdo->query("SELECT 1");
    if (!$testStmt) {
        throw new Exception("Database connection test failed");
    }

    // --- Fetch single event by ID if ?id=... is provided ---
    if (isset($_GET['id'])) {
        $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
        if ($id === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid event ID']);
            exit;
        }
        
        error_log("Fetching single event with ID: $id");
        
        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $event = $stmt->fetch();

        if ($event) {
            // Decode JSON fields
            if (isset($event['sub_categories'])) {
                $event['sub_categories'] = json_decode($event['sub_categories'], true);
            }
            if (isset($event['ticketTypes'])) {
                $event['ticketTypes'] = json_decode($event['ticketTypes'], true);
            }
            echo json_encode($event);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
        }
        exit;
    }

    // Get pagination parameters (validated)
    $page = isset($_GET['page']) ? filter_var($_GET['page'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'default' => 1]]) : 1;
    $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 50, 'default' => 12]]) : 12;
    $offset = ($page - 1) * $limit;
    
    error_log("Processing request with page=$page, limit=$limit");
    
    // Build the query based on parameters
    $query = 'SELECT * FROM events';
    $countQuery = 'SELECT COUNT(*) FROM events';
    $params = [];
    $where = [];
    
    // Add category filter if provided
    if (isset($_GET['category']) && $_GET['category'] !== 'all') {
        $category = sanitizeInput($_GET['category']);
        if (!empty($category)) {
            error_log("Filtering by category: $category");
            $where[] = 'category = ?';
            $params[] = $category;
        }
    }
    
    // Add featured filter if provided
    if (isset($_GET['featured'])) {
        $featured = filter_var($_GET['featured'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 1]]);
        if ($featured !== false) {
            error_log("Filtering for featured events: $featured");
            $where[] = 'featured = ?';
            $params[] = $featured;
        }
    }
    
    // Advanced search functionality
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = sanitizeInput($_GET['search']);
        error_log("Searching for: $search");
        
        // Debug log search query
        error_log("SEARCH DEBUG: Processing search request for term: " . $search);
        
        // Execute a test query to verify search is working
        try {
            $testSearchCondition = "title LIKE ?";
            $testStmt = $pdo->prepare("SELECT COUNT(*) FROM events WHERE $testSearchCondition");
            $testStmt->execute(["%$search%"]);
            $testCount = $testStmt->fetchColumn();
            error_log("TEST SEARCH: Found $testCount events with '$search' in title");
        } catch (Exception $e) {
            error_log("TEST SEARCH FAILED: " . $e->getMessage());
        }
        
        // Split search terms for more intelligent searching
        $searchTerms = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);
        
        if (count($searchTerms) > 0) {
            $searchConditions = [];
            
            // For each search term, search across multiple fields
            foreach ($searchTerms as $term) {
                $termParams = [];
                $termConditions = [];
                
                // Search in title (higher weight)
                $termConditions[] = 'title LIKE ?';
                $termParams[] = "%$term%";
                
                // Search in description
                $termConditions[] = 'description LIKE ?';
                $termParams[] = "%$term%";
                
                // Search in location
                $termConditions[] = 'location LIKE ?';
                $termParams[] = "%$term%";
                
                // Search in organizer
                $termConditions[] = 'organizer LIKE ?';
                $termParams[] = "%$term%";
                
                $searchConditions[] = '(' . implode(' OR ', $termConditions) . ')';
                $params = array_merge($params, $termParams);
            }
            
            // Combine all search terms with AND logic
            $where[] = '(' . implode(' AND ', $searchConditions) . ')';
        }
    }
    
    // Add date range filter
    if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
        $dateFrom = sanitizeInput($_GET['date_from']);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $where[] = 'event_date >= ?';
            $params[] = $dateFrom . ' 00:00:00';
        }
    }
    
    if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
        $dateTo = sanitizeInput($_GET['date_to']);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $where[] = 'event_date <= ?';
            $params[] = $dateTo . ' 23:59:59';
        }
    }
    
    // Add price range filter
    if (isset($_GET['price_min']) && !empty($_GET['price_min'])) {
        $priceMin = filter_var($_GET['price_min'], FILTER_VALIDATE_FLOAT, ['options' => ['min_range' => 0]]);
        if ($priceMin !== false) {
            $where[] = 'price >= ?';
            $params[] = $priceMin;
        }
    }
    
    if (isset($_GET['price_max']) && !empty($_GET['price_max'])) {
        $priceMax = filter_var($_GET['price_max'], FILTER_VALIDATE_FLOAT, ['options' => ['min_range' => 0]]);
        if ($priceMax !== false) {
            $where[] = 'price <= ?';
            $params[] = $priceMax;
        }
    }
    
    // Construct WHERE clause if conditions exist
    if (!empty($where)) {
        $query .= ' WHERE ' . implode(' AND ', $where);
        $countQuery .= ' WHERE ' . implode(' AND ', $where);
    }
    
    // Add sorting (with validation)
    $sortBy = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'event_date';
    $sortDirection = isset($_GET['direction']) && strtolower($_GET['direction']) === 'desc' ? 'DESC' : 'ASC';
    
    // Whitelist allowed sorting columns to prevent SQL injection
    $allowedSortColumns = ['event_date', 'title', 'price', 'created_at'];
    $sortBy = in_array($sortBy, $allowedSortColumns) ? $sortBy : 'event_date';
    
    error_log("Sorting by $sortBy $sortDirection");
    $query .= " ORDER BY $sortBy $sortDirection";
    
    // Execute count query first to get total items
    error_log("Executing count query: $countQuery");
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $totalItems = $countStmt->fetchColumn();
    error_log("Total items: $totalItems");
    
    // Add pagination to the main query
    $query .= " LIMIT $limit OFFSET $offset";
    
    // Execute main query to get events for current page
    error_log("Executing main query: $query");
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $events = $stmt->fetchAll();
    error_log("Retrieved " . count($events) . " events");

    // Decode JSON fields
    foreach ($events as &$event) {
        if (isset($event['sub_categories'])) {
            $event['sub_categories'] = json_decode($event['sub_categories'], true);
        }
        if (isset($event['ticketTypes'])) {
            $event['ticketTypes'] = json_decode($event['ticketTypes'], true);
        }
    }

    // Return data in the expected format with pagination metadata
    $response = [
        'data' => $events,
        'pagination' => [
            'total' => $totalItems,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($totalItems / $limit)
        ],
        'meta' => [
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.1.0',
            'search_term' => isset($_GET['search']) ? $_GET['search'] : null,
            'processed_in_ms' => round(microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"], 3) * 1000
        ]
    ];
    
    error_log("Sending response with " . count($events) . " events and pagination data");
    error_log("Response payload size: " . strlen(json_encode($response)) . " bytes");
    echo json_encode($response);
} catch (Exception $e) {
    $errorMessage = 'An error occurred while processing your request.';
    $errorDetails = $e->getMessage();
    
    // Only log the full details, don't expose them to clients
    error_log("API ERROR: $errorDetails");
    
    http_response_code(500);
    echo json_encode([
        'error' => $errorMessage,
        'request_id' => uniqid() // For tracking issues in logs
    ]);
}
