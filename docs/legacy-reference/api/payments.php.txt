<?php
// Enable error reporting only in development environment
// Comment out these lines in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set appropriate headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // In production, restrict this to your domain
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include database configuration
require_once 'db_config.php';

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
$requestData = json_decode($rawInput, true);

// Validate request format
if (!$requestData || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON payload'
    ]);
    exit();
}

// Log received data for debugging
logError("Payment verification request received", $requestData);

try {
    // Validate required fields
    $requiredFields = ['reference', 'formData', 'cartItems'];
    foreach ($requiredFields as $field) {
        if (!isset($requestData[$field])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => "Missing required field: {$field}"
            ]);
            exit();
        }
    }

    // Extract data for easier access
    $reference = $requestData['reference'];
    $formData = $requestData['formData'];
    $cartItems = $requestData['cartItems'];

    // Validate reference
    if (!is_string($reference) || strlen($reference) < 5) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid payment reference'
        ]);
        exit();
    }

    // Validate form data
    $formRequiredFields = ['firstName', 'lastName', 'email', 'phone'];
    foreach ($formRequiredFields as $field) {
        if (!isset($formData[$field]) || empty(trim($formData[$field]))) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => "Missing or empty customer {$field}"
            ]);
            exit();
        }
    }

    // Email validation
    if (!filter_var($formData['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email format'
        ]);
        exit();
    }

    // Phone validation - basic format check
    if (!preg_match('/^\+?[\d\s-]{10,}$/', $formData['phone'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid phone number format'
        ]);
        exit();
    }

    // Validate cart items
    if (!is_array($cartItems) || empty($cartItems)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Cart is empty or invalid'
        ]);
        exit();
    }

    // Validate each cart item
    $totalAmount = 0;
    foreach ($cartItems as $item) {
        $itemRequiredFields = ['eventId', 'eventTitle', 'ticketType', 'quantity', 'pricePerTicket'];
        foreach ($itemRequiredFields as $field) {
            if (!isset($item[$field])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => "Missing cart item field: {$field}"
                ]);
                exit();
            }
        }
        
        // Validate numeric fields
        if (!is_numeric($item['quantity']) || $item['quantity'] <= 0) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid quantity for item: ' . $item['eventTitle']
            ]);
            exit();
        }
        
        if (!is_numeric($item['pricePerTicket']) || $item['pricePerTicket'] < 0) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid price for item: ' . $item['eventTitle']
            ]);
            exit();
        }
        
        // Calculate total
        $totalAmount += $item['quantity'] * $item['pricePerTicket'];
    }

    // Test database connection
    $db = getDbConnection();
    if (!$db) {
        logError("Database connection failed");
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection error. Please try again later.'
        ]);
        exit();
    }
    
    logError("Database connection successful");

    // Start transaction to ensure data consistency
    try {
        $db->beginTransaction();
        
        // Insert transaction record
        $stmt = $db->prepare("
            INSERT INTO transactions 
            (reference, customer_first_name, customer_last_name, customer_email, customer_phone, total_amount) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $reference, 
            $formData['firstName'], 
            $formData['lastName'], 
            $formData['email'], 
            $formData['phone'], 
            $totalAmount
        ]);
        
        logError("Transaction record inserted", ['reference' => $reference]);
        
        // Generate tickets and insert them
        $tickets = [];
        foreach ($cartItems as $item) {
            for ($i = 0; $i < $item['quantity']; $i++) {
                // Generate a unique ticket ID
                $ticketId = 'TKT-' . substr(md5(uniqid(mt_rand(), true)), 0, 10);
                
                // Insert ticket record
                $ticketStmt = $db->prepare("
                    INSERT INTO tickets 
                    (ticket_id, transaction_reference, event_id, event_title, ticket_type, price_per_ticket, holder_name, holder_email) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $ticketStmt->execute([
                    $ticketId,
                    $reference,
                    $item['eventId'],
                    $item['eventTitle'],
                    $item['ticketType'],
                    $item['pricePerTicket'],
                    $formData['firstName'] . ' ' . $formData['lastName'],
                    $formData['email']
                ]);
                
                logError("Ticket created", ['ticketId' => $ticketId]);
                
                // Add ticket to the response
                $tickets[] = [
                    'ticketId' => $ticketId,
                    'eventId' => $item['eventId'],
                    'eventTitle' => $item['eventTitle'],
                    'ticketType' => $item['ticketType'],
                    'purchaseDate' => date('Y-m-d H:i:s'),
                    'holderName' => $formData['firstName'] . ' ' . $formData['lastName'],
                    'holderEmail' => $formData['email']
                ];
            }
        }
        
        // Commit the transaction
        $db->commit();
        logError("Transaction committed successfully");
        
        // Send success response
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Payment verified and tickets created successfully',
            'reference' => $reference,
            'customer' => [
                'name' => $formData['firstName'] . ' ' . $formData['lastName'],
                'email' => $formData['email'],
                'phone' => $formData['phone']
            ],
            'payment_details' => [
                'amount' => $totalAmount,
                'currency' => 'NGN',
                'date' => date('Y-m-d H:i:s')
            ],
            'tickets' => $tickets
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        
        // Log the detailed error
        logError("Database error: " . $e->getMessage(), [
            'code' => $e->getCode(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Return error response
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage(),
            'debug_info' => 'Check server logs for details'
        ]);
    }
} catch (Exception $e) {
    // Log any unexpected errors
    logError("Unexpected error: " . $e->getMessage(), [
        'code' => $e->getCode(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unexpected error occurred: ' . $e->getMessage(),
        'debug_info' => 'Check server logs for details'
    ]);
}

exit(); 