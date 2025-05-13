<?php
// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.0 403 Forbidden');
    echo json_encode(['status' => 'error', 'message' => 'Direct access not allowed']);
    exit;
}

// Enable CORS for your frontend domain
header("Access-Control-Allow-Origin: http://yourdomain.com"); // Replace with your frontend domain
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Load environment variables from .env file
// You'll need to create this file with your secret key
$env = parse_ini_file('.env');
$secretKey = $env['PAYSTACK_SECRET_KEY'];

// Include database functions
require_once 'db-config.php';

// Get the reference from POST data
$inputData = json_decode(file_get_contents('php://input'), true);
$reference = isset($inputData['reference']) ? $inputData['reference'] : null;

if (!$reference) {
    echo json_encode(['status' => 'error', 'message' => 'No reference supplied']);
    exit;
}

// Verify the transaction by calling Paystack's API
function verifyPaystackTransaction($reference, $secretKey) {
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . rawurlencode($reference),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $secretKey,
            "Cache-Control: no-cache",
        ],
    ]);
    
    $response = curl_exec($curl);
    $err = curl_error($curl);
    
    curl_close($curl);
    
    if ($err) {
        return ['status' => 'error', 'message' => 'cURL Error: ' . $err];
    }
    
    return json_decode($response, true);
}

// Call the verification function
$verificationResult = verifyPaystackTransaction($reference, $secretKey);

// Check if verification was successful
if ($verificationResult['status'] === true && $verificationResult['data']['status'] === 'success') {
    // Payment was successful, record transaction details
    $transaction = $verificationResult['data'];
    
    // Get customer details
    $customerEmail = $transaction['customer']['email'];
    $amount = $transaction['amount'] / 100; // Amount in actual currency (not kobo)
    $currency = $transaction['currency'];
    $paymentDate = $transaction['paid_at'];
    
    // Store transaction in database
    $transactionRef = saveTransactionToDb($transaction);
    
    if ($transactionRef) {
        // Generate and save tickets
        $tickets = generateTickets($transaction, $transactionRef);
        
        // Return success response with ticket details
        echo json_encode([
            'status' => 'success',
            'message' => 'Payment verified successfully',
            'data' => [
                'reference' => $reference,
                'amount' => $amount,
                'currency' => $currency,
                'email' => $customerEmail,
                'date' => $paymentDate,
                'tickets' => $tickets
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to save transaction']);
    }
} else {
    // Payment verification failed
    echo json_encode([
        'status' => 'error', 
        'message' => 'Payment verification failed',
        'data' => $verificationResult
    ]);
}

/**
 * Generate tickets for the transaction
 * 
 * @param array $transaction Transaction details from Paystack
 * @param string $transactionRef Transaction reference
 * @return array Generated ticket details
 */
function generateTickets($transaction, $transactionRef) {
    $tickets = [];
    $orderItems = [];
    
    // Extract order items from metadata
    foreach ($transaction['metadata']['custom_fields'] as $field) {
        if (strpos($field['variable_name'], 'order_item_') === 0) {
            // Parse the order item value to extract event title, ticket type, and quantity
            $itemInfo = $field['value'];
            preg_match('/(.+) - (.+) \(Qty: (\d+)\)/', $itemInfo, $matches);
            
            if (count($matches) === 4) {
                $eventTitle = $matches[1];
                $ticketType = $matches[2];
                $quantity = (int)$matches[3];
                
                $orderItems[] = [
                    'eventTitle' => $eventTitle,
                    'ticketType' => $ticketType,
                    'quantity' => $quantity
                ];
            }
        }
    }
    
    // Generate tickets for each order item
    foreach ($orderItems as $item) {
        for ($i = 0; $i < $item['quantity']; $i++) {
            $ticketId = 'TKT-' . time() . '-' . rand(1000, 9999);
            
            $ticket = [
                'ticketId' => $ticketId,
                'eventTitle' => $item['eventTitle'],
                'ticketType' => $item['ticketType'],
                'customerName' => $transaction['metadata']['customer_details']['first_name'] . ' ' . 
                                 $transaction['metadata']['customer_details']['last_name'],
                'customerEmail' => $transaction['customer']['email'],
                'issueDate' => date('Y-m-d H:i:s'),
                'reference' => $transaction['reference']
            ];
            
            // Save ticket to database
            saveTicketToDb($ticket, $transactionRef);
            
            $tickets[] = $ticket;
        }
    }
    
    return $tickets;
}
?> 