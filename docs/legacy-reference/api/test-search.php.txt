<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// This is a simplified version of events.php for testing
// Only includes basic search functionality

// Database config
$host = 'localhost';
$port = 3307;
$db   = 'events';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Try to load external config if exists
if (file_exists(__DIR__ . '/db_config.php')) {
    include_once(__DIR__ . '/db_config.php');
    if (function_exists('getDbConnection')) {
        error_log("FALLBACK SEARCH: Using external database configuration from db_config.php");
        $pdo = getDbConnection();
        // If we have a valid connection, skip the standard connection code
        if ($pdo !== null) {
            error_log("FALLBACK SEARCH: Successfully connected using db_config.php");
        } else {
            error_log("FALLBACK SEARCH: Connection using db_config.php failed, will try local config");
        }
    } else {
        error_log("FALLBACK SEARCH: db_config.php exists but getDbConnection() function not found, using local config");
        // Use the variables from db_config if available
        if (isset($db_name)) $db = $db_name;
        if (isset($db_user)) $user = $db_user;
        if (isset($db_pass)) $pass = $db_pass;
        if (isset($db_host)) $host = $db_host;
    }
}

// Enable error logging
ini_set('display_errors', 0);
error_log("FALLBACK SEARCH: Request received for search");
if (isset($_GET['search'])) {
    error_log("FALLBACK SEARCH: Query = " . $_GET['search']);
}

// Configure secure database connection options
$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    error_log("FALLBACK SEARCH: Attempting database connection");
    $pdo = new PDO($dsn, $user, $pass, $options);
    error_log("FALLBACK SEARCH: Database connection successful");
    
    // Simple paging
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 12;
    $offset = ($page - 1) * $limit;
    
    // Build query
    $query = 'SELECT * FROM events';
    $params = [];
    $where = [];
    
    // Add search 
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = strtolower($_GET['search']);
        $where[] = '(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ? OR LOWER(organizer) LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    // Add category filter
    if (isset($_GET['category']) && $_GET['category'] !== 'all') {
        $category = $_GET['category'];
        $where[] = 'category = ?';
        $params[] = $category;
    }
    
    // Combine where clauses
    if (!empty($where)) {
        $query .= ' WHERE ' . implode(' AND ', $where);
    }
    
    // Add sorting
    $query .= ' ORDER BY event_date ASC';
    
    // Add limit
    $query .= ' LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;
    
    // Count total
    $countQuery = 'SELECT COUNT(*) FROM events';
    if (!empty($where)) {
        $countQuery .= ' WHERE ' . implode(' AND ', $where);
    }
    
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute(array_slice($params, 0, -2)); // Remove limit/offset params
    $total = $countStmt->fetchColumn();
    
    // Execute main query
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $events = $stmt->fetchAll();
    error_log("FALLBACK SEARCH: Retrieved " . count($events) . " events");
    
    // Return with pagination
    $response = [
        'status' => 'success',
        'data' => $events,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ],
        'request' => [
            'search' => $_GET['search'] ?? null,
            'category' => $_GET['category'] ?? null
        ]
    ];
    
    echo json_encode($response);
    error_log("FALLBACK SEARCH: Response size: " . strlen(json_encode($response)) . " bytes");
    
} catch (Exception $e) {
    error_log("FALLBACK SEARCH ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'debug' => $e->getMessage()
    ]);
} 