<?php
// test.php - Simple test file to verify PHP execution

// Set content type to JSON
header('Content-Type: application/json');

// Allow all origins during development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Output simple JSON response
echo json_encode([
    'status' => 'success',
    'message' => 'PHP server is working correctly',
    'time' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);
?> 