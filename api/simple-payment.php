<?php
// Set error reporting for development (remove in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set appropriate headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Log function for debugging
function logError($message, $data = null) {
    $logFile = __DIR__ . '/payment_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    
    if ($data !== null) {
        $logMessage .= " Data: " . json_encode($data);
    }
    
    file_put_contents($logFile, $logMessage . PHP_EOL, FILE_APPEND);
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log that the script was accessed
logError("Payment script accessed via " . $_SERVER['REQUEST_METHOD']);

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed. Please use POST.'
    ]);
    exit();
}

// Get request data
$rawInput = file_get_contents('php://input');
logError("Raw input received: " . substr($rawInput, 0, 200) . "...");

// Try to decode JSON
$requestData = json_decode($rawInput, true);
if (!$requestData || json_last_error() !== JSON_ERROR_NONE) {
    logError("JSON decode error: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON payload: ' . json_last_error_msg()
    ]);
    exit();
}

// Log successful data receipt
logError("Successfully decoded JSON data", $requestData);

// Simple success response (no database yet)
$reference = $requestData['reference'] ?? 'unknown-ref';
$tickets = [];

// Extract customer info if available
$firstName = $requestData['formData']['firstName'] ?? 'Customer';
$lastName = $requestData['formData']['lastName'] ?? '';
$email = $requestData['formData']['email'] ?? 'customer@example.com';

// Generate mock tickets from cart items if available
if (isset($requestData['cartItems']) && is_array($requestData['cartItems'])) {
    foreach ($requestData['cartItems'] as $item) {
        $quantity = $item['quantity'] ?? 1;
        
        for ($i = 0; $i < $quantity; $i++) {
            $tickets[] = [
                'ticketId' => 'TKT-' . mt_rand(1000000, 9999999),
                'eventId' => $item['eventId'] ?? 'unknown',
                'eventTitle' => $item['eventTitle'] ?? 'Event',
                'ticketType' => $item['ticketType'] ?? 'Standard',
                'purchaseDate' => date('Y-m-d H:i:s'),
                'holderName' => $firstName . ' ' . $lastName,
                'holderEmail' => $email
            ];
        }
    }
}

// Send success response
logError("Sending success response with " . count($tickets) . " tickets");

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Payment processed successfully (simplified version)',
    'reference' => $reference,
    'customer' => [
        'name' => $firstName . ' ' . $lastName,
        'email' => $email
    ],
    'payment_details' => [
        'amount' => 0,
        'currency' => 'NGN',
        'date' => date('Y-m-d H:i:s')
    ],
    'tickets' => $tickets
]);

logError("Script completed successfully");
exit(); 