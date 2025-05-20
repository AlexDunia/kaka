<?php
// payment-simple.php - Simplified Paystack integration (no database)
header('Content-Type: application/json');

// CORS headers to allow requests from your frontend
header('Access-Control-Allow-Origin: *'); // Allow all origins during development
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Enable error reporting during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

// Paystack configuration
$paystackSecretKey = 'sk_test_XXXXXXXXXXXXXXXXXXXX'; // Replace with your actual test secret key
$paystackVerifyUrl = 'https://api.paystack.co/transaction/verify/';

try {
    // Get JSON input from the request
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    // Check for valid JSON data
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON payload: ' . json_last_error_msg());
    }

    // Log the input data
    error_log('Input data: ' . $inputJSON);

    // Validate required fields in the request
    if (empty($input['reference'])) {
        throw new Exception('Transaction reference is required');
    }

    $reference = htmlspecialchars(strip_tags($input['reference']));
    
    // If you want to skip actual Paystack verification during testing,
    // uncomment this section and comment out the curl section below
    /*
    // Generate fake ticket IDs for testing
    $ticketCount = 0;
    $ticketIdsGenerated = [];
    
    if (!empty($input['cartItems']) && is_array($input['cartItems'])) {
        foreach ($input['cartItems'] as $item) {
            $quantity = (int) ($item['quantity'] ?? 1);
            $ticketCount += $quantity;
        }
    }
    
    $baseTicketId = 'TIX-' . strtoupper(substr(md5($reference), 0, 6));
    for ($i = 1; $i <= $ticketCount; $i++) {
        $ticketIdsGenerated[] = $baseTicketId . '-' . str_pad($i, 3, '0', STR_PAD_LEFT);
    }
    
    // Return success response with generated ticket IDs
    $responseData = [
        'status' => 'success',
        'message' => 'Payment verified successfully (test mode)',
        'transaction_id' => 'test-' . time(),
        'tickets' => $ticketIdsGenerated,
        'event_id' => null,
        'payment_details' => [
            'amount' => 0,
            'currency' => 'NGN',
            'reference' => $reference,
            'payment_method' => 'test'
        ]
    ];
    
    echo json_encode($responseData);
    exit();
    */

    // Verify the transaction with Paystack
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $paystackVerifyUrl . $reference,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $paystackSecretKey,
            "Cache-Control: no-cache",
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        throw new Exception("cURL Error: " . $err);
    }

    $transaction = json_decode($response, true);
    
    // Log the Paystack response
    error_log('Paystack response: ' . $response);

    // Check if verification was successful
    if (!$transaction['status'] || $transaction['data']['status'] !== 'success') {
        throw new Exception("Transaction verification failed: " . ($transaction['message'] ?? 'Unknown error'));
    }

    // Extract transaction data from Paystack response
    $txData = $transaction['data'];
    $amountPaid = $txData['amount'] / 100; // Convert kobo to naira
    $paystackRef = $txData['reference'];
    
    // Generate ticket IDs - similar to TIX-CA1223A5-001
    $ticketCount = 0;
    $ticketIdsGenerated = [];
    
    if (!empty($input['cartItems']) && is_array($input['cartItems'])) {
        foreach ($input['cartItems'] as $item) {
            $quantity = (int) ($item['quantity'] ?? 1);
            $ticketCount += $quantity;
        }
    }
    
    $baseTicketId = 'TIX-' . strtoupper(substr(md5($paystackRef), 0, 6));
    for ($i = 1; $i <= $ticketCount; $i++) {
        $ticketIdsGenerated[] = $baseTicketId . '-' . str_pad($i, 3, '0', STR_PAD_LEFT);
    }
    
    // Prepare success response with ticket IDs and payment info
    $responseData = [
        'status' => 'success',
        'message' => 'Payment verified successfully',
        'transaction_id' => 'tx-' . time(), // Just a placeholder since we're not using a database
        'tickets' => $ticketIdsGenerated,
        'event_id' => null,
        'payment_details' => [
            'amount' => $amountPaid,
            'currency' => 'NGN',
            'reference' => $paystackRef,
            'payment_method' => $txData['channel'] ?? 'card'
        ]
    ];
    
    echo json_encode($responseData);

} catch (Exception $e) {
    // Log the error
    error_log('Payment Error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage(),
        'code' => 'PAYMENT_ERROR'
    ]);
}
?> 