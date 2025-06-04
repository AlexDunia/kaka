// Load API key from environment variable
$apiKey = getenv('API_KEY') ?: 'app_12345_my_custom_secure_key'; // Use .env in production

// Forward the request to payment.php
$inputJSON = file_get_contents('php://input');
// Use full URL for payment endpoint
$paymentUrl = 'https://kakaworld.co/api/payments.php'; // Update to your actual domain if different

// Log input for debugging
file_put_contents(__DIR__ . '/proxy_debug.log', "Input: $inputJSON\n", FILE_APPEND);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $paymentUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $inputJSON,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Log output for debugging
file_put_contents(__DIR__ . '/proxy_debug.log', "Response: $response\nHTTP Code: $httpCode\n", FILE_APPEND);

if ($response === false) {
    $error = curl_error($ch);
    curl_close($ch);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'cURL error: ' . $error]);
    exit();
}

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['status' => 'error', 'message' => 'Payment verification failed']);
    exit();
}

echo $response; 