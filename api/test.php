<?php
// Set appropriate headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Simple response
echo json_encode([
    'status' => 'success',
    'message' => 'API server is working correctly',
    'time' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);
?> 