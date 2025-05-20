<?php
// payment.php - Paystack integration with security measures
header('Content-Type: application/json');

// CORS headers to allow requests from your frontend
header('Access-Control-Allow-Origin: *'); // Allow all origins during development
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Enable error reporting during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include database configuration
require_once 'api/db_config.php';
// We'll use the second set of credentials ($host, $port, $db, $user, $pass, $charset)

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
        throw new Exception('Invalid JSON payload');
    }

    // Validate required fields in the request
    if (empty($input['reference'])) {
        throw new Exception('Transaction reference is required');
    }

    $reference = htmlspecialchars(strip_tags($input['reference']));

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

    // Check if verification was successful
    if (!$transaction['status'] || $transaction['data']['status'] !== 'success') {
        throw new Exception("Transaction verification failed: " . ($transaction['message'] ?? 'Unknown error'));
    }

    // Extract transaction data from Paystack response
    $txData = $transaction['data'];
    $amountPaid = $txData['amount'] / 100; // Convert kobo to naira
    $amountKobo = $txData['amount'];
    $paystackRef = $txData['reference'];
    $customerEmail = $txData['customer']['email'];
    $channel = $txData['channel'];
    $paidAt = $txData['paid_at'];
    $ipAddress = $txData['ip_address'] ?? $_SERVER['REMOTE_ADDR'];
    $status = $txData['status'];
    
    // Extract metadata
    $metadata = $txData['metadata'] ?? [];
    $customFields = $metadata['custom_fields'] ?? [];
    
    // Default values in case metadata is missing
    $customerName = "Unknown Customer";
    $customerPhone = "";
    $orderItems = "";
    $ticketCount = 0;
    $cartId = $metadata['cart_id'] ?? ('cart-' . time());
    
    // Extract customer name from metadata
    foreach ($customFields as $field) {
        if ($field['variable_name'] === 'customer_name') {
            $customerName = htmlspecialchars(strip_tags($field['value']));
        } elseif ($field['variable_name'] === 'phone_number') {
            $customerPhone = htmlspecialchars(strip_tags($field['value']));
        } elseif ($field['variable_name'] === 'order_items') {
            $orderItems = htmlspecialchars(strip_tags($field['value']));
        } elseif ($field['variable_name'] === 'total_tickets') {
            $totalTickets = $field['value'];
            $ticketCount = (int) substr($totalTickets, 0, strpos($totalTickets, ' tickets'));
        }
    }
    
    // Extract the customer details object if available
    $customerDetails = $metadata['customer_details'] ?? [];
    if (!empty($customerDetails)) {
        $firstName = htmlspecialchars(strip_tags($customerDetails['first_name'] ?? ''));
        $lastName = htmlspecialchars(strip_tags($customerDetails['last_name'] ?? ''));
        if ($firstName && $lastName) {
            $customerName = "$firstName $lastName";
        }
        if (empty($customerPhone) && !empty($customerDetails['phone'])) {
            $customerPhone = htmlspecialchars(strip_tags($customerDetails['phone']));
        }
    }
    
    // Get payment method and card details
    $paymentMethod = $txData['channel'];
    $cardDetails = '';
    if (!empty($txData['authorization'])) {
        $auth = $txData['authorization'];
        $cardType = $auth['card_type'] ?? '';
        $last4 = $auth['last4'] ?? '';
        if ($cardType && $last4) {
            $cardDetails = strtoupper($cardType) . " Ending with " . $last4;
        }
    }
    
    // Connect to the database using credentials from db_config.php (second set)
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Parse the orderItems and turn it into JSON for the ticket_details column
    // Also extract event IDs for linking to the events table
    // Example: "Event A - VIP Ticket (Qty: 2), Event B - Regular Ticket (Qty: 1)"
    $ticketDetailsArray = [];
    $primaryEventId = null; // We'll use the first event ID as the primary one
    
    // If we received cartItems in the request, use those for more detailed information
    if (!empty($input['cartItems']) && is_array($input['cartItems'])) {
        foreach ($input['cartItems'] as $item) {
            $eventId = isset($item['eventId']) ? (int) $item['eventId'] : null;
            $eventTitle = htmlspecialchars(strip_tags($item['eventTitle'] ?? ''));
            $ticketType = htmlspecialchars(strip_tags($item['ticketType'] ?? ''));
            $quantity = (int) ($item['quantity'] ?? 1);
            $pricePerTicket = (float) ($item['pricePerTicket'] ?? 0);
            
            // Create a ticket detail object
            $ticketDetail = [
                'event_id' => $eventId,
                'event_name' => $eventTitle,
                'ticket_type' => $ticketType,
                'quantity' => $quantity,
                'price_per_ticket' => $pricePerTicket
            ];
            
            $ticketDetailsArray[] = $ticketDetail;
            
            // Store the first event_id as the primary one for the foreign key
            if ($primaryEventId === null && $eventId !== null) {
                $primaryEventId = $eventId;
            }
        }
    } else {
        // Fallback to parsing the orderItems string
        $items = explode(', ', $orderItems);
        foreach ($items as $item) {
            if (preg_match('/^(.+) - (.+) \(Qty: (\d+)\)$/', $item, $matches)) {
                $eventName = $matches[1];
                $ticketType = $matches[2];
                $quantity = (int) $matches[3];
                
                // Create a ticket detail object
                $ticketDetail = [
                    'event_name' => $eventName,
                    'ticket_type' => $ticketType,
                    'quantity' => $quantity
                ];
                
                $ticketDetailsArray[] = $ticketDetail;
            }
        }
    }
    
    $ticketDetailsJson = json_encode($ticketDetailsArray);
    
    // Generate ticket IDs - similar to TIX-CA1223A5-001 from your example
    $ticketIdsGenerated = [];
    $baseTicketId = 'TIX-' . strtoupper(substr(md5($paystackRef), 0, 6));
    for ($i = 1; $i <= $ticketCount; $i++) {
        $ticketIdsGenerated[] = $baseTicketId . '-' . str_pad($i, 3, '0', STR_PAD_LEFT);
    }
    $ticketIdsString = implode(',', $ticketIdsGenerated);
    
    // Prepare SQL statement - now including event_id
    $sql = "INSERT INTO transactions (
        event_id, paystack_reference, order_reference, customer_name, customer_email, 
        customer_phone, ticket_details, ticket_count, ids_generated, 
        currency, amount, amount_kobo, payment_method, card_details, 
        transaction_date, paystack_paid_at, channel, ip_address, status, paystack_log
    ) VALUES (
        :event_id, :paystack_reference, :order_reference, :customer_name, :customer_email,
        :customer_phone, :ticket_details, :ticket_count, :ids_generated,
        :currency, :amount, :amount_kobo, :payment_method, :card_details,
        NOW(), :paystack_paid_at, :channel, :ip_address, :status, :paystack_log
    )";
    
    $stmt = $pdo->prepare($sql);
    
    // Bind the parameters
    $stmt->bindParam(':event_id', $primaryEventId); // The primary event ID from the cart items
    $stmt->bindParam(':paystack_reference', $paystackRef);
    $stmt->bindParam(':order_reference', $cartId);
    $stmt->bindParam(':customer_name', $customerName);
    $stmt->bindParam(':customer_email', $customerEmail);
    $stmt->bindParam(':customer_phone', $customerPhone);
    $stmt->bindParam(':ticket_details', $ticketDetailsJson);
    $stmt->bindParam(':ticket_count', $ticketCount);
    $stmt->bindParam(':ids_generated', $ticketIdsString);
    
    $currency = 'NGN'; // Can be extracted from Paystack response if needed
    $stmt->bindParam(':currency', $currency);
    $stmt->bindParam(':amount', $amountPaid);
    $stmt->bindParam(':amount_kobo', $amountKobo);
    $stmt->bindParam(':payment_method', $paymentMethod);
    $stmt->bindParam(':card_details', $cardDetails);
    $stmt->bindParam(':paystack_paid_at', $paidAt);
    $stmt->bindParam(':channel', $channel);
    $stmt->bindParam(':ip_address', $ipAddress);
    $stmt->bindParam(':status', $status);
    
    // Store the full Paystack response for reference/debugging
    $paystackLog = json_encode($txData);
    $stmt->bindParam(':paystack_log', $paystackLog);
    
    // Execute the query
    $stmt->execute();
    
    // Prepare success response with ticket IDs and event info
    $responseData = [
        'status' => 'success',
        'message' => 'Payment verified and transaction recorded successfully',
        'transaction_id' => $pdo->lastInsertId(),
        'tickets' => $ticketIdsGenerated,
        'event_id' => $primaryEventId,
        'payment_details' => [
            'amount' => $amountPaid,
            'currency' => $currency,
            'reference' => $paystackRef,
            'payment_method' => $cardDetails ?: $paymentMethod
        ]
    ];
    
    echo json_encode($responseData);

} catch (PDOException $e) {
    // Database errors
    error_log('Database Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error occurred. Please try again later.',
        'code' => 'DB_ERROR'
    ]);
} catch (Exception $e) {
    // General errors
    error_log('Payment Error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage(),
        'code' => 'PAYMENT_ERROR'
    ]);
}
?> 