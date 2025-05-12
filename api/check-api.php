<?php
// Simple API check script
header('Content-Type: application/json');

// Output basic server information
$info = [
    'status' => 'OK',
    'time' => date('Y-m-d H:i:s'),
    'server' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'php_version' => phpversion(),
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
    ],
    'message' => 'API is functioning correctly',
];

// Test database connection if needed
if (isset($_GET['test_db']) && $_GET['test_db'] === '1') {
    try {
        // Database config
        $host = 'localhost';
        $port = 3307; // You're using MySQL on port 3307
        $db   = 'events';
        $user = 'root';
        $pass = ''; // Add your actual password here if any
        $charset = 'utf8mb4';
        
        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ];
        
        $pdo = new PDO($dsn, $user, $pass, $options);
        $info['database'] = [
            'connection' => 'Successful',
            'driver' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME),
            'version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        ];
        
        // Test a simple query
        $stmt = $pdo->query('SELECT COUNT(*) FROM events');
        $info['database']['event_count'] = $stmt->fetchColumn();
    } catch (Exception $e) {
        $info['database'] = [
            'connection' => 'Failed',
            'error' => $e->getMessage(),
        ];
    }
}

// Return the information
echo json_encode($info, JSON_PRETTY_PRINT); 