<?php
header('Content-Type: application/json');

// Database config
$host = 'localhost';
$port = 3307; // You're using MySQL on port 3307
$db   = 'events';
$user = 'root';
$pass = ''; // Add your actual password here if any
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Optional: insert a sample event (comment out after first use)
    /*
    $stmt = $pdo->prepare("INSERT INTO events 
        (title, description, category, sub_categories, event_date, location, main_image, banner_image, price, total_tickets, available_tickets, featured, organizer, duration, ticketTypes)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        'Summer Music Festival',
        'Join us for three days of amazing music!',
        'Music',
        json_encode(['Rock', 'Pop', 'Indie']),
        '2025-06-21 18:00:00',
        'Central Park, NYC',
        'https://example.com/images/main.jpg',
        'https://example.com/images/banner.jpg',
        49.99,
        5000,
        4000,
        true,
        'Music Corp',
        '3 days',
        json_encode([
            [
                'name' => 'VIP',
                'price' => 150,
                'quantity' => 50,
                'description' => 'Premium seating with free drinks',
                'isFeatured' => true
            ],
            [
                'name' => 'Gold',
                'price' => 120,
                'quantity' => 80,
                'description' => 'Great view with early access',
                'isFeatured' => true
            ]
        ])
    ]);
    */

    // --- NEW: Fetch single event by ID if ?id=... is provided ---
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $event = $stmt->fetch();

        if ($event) {
            // Decode JSON fields
            if (isset($event['sub_categories'])) {
                $event['sub_categories'] = json_decode($event['sub_categories'], true);
            }
            if (isset($event['ticketTypes'])) {
                $event['ticketTypes'] = json_decode($event['ticketTypes'], true);
            }
            echo json_encode($event);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
        }
        exit;
    }

    // Fetch all events (default)
    $stmt = $pdo->query('SELECT * FROM events');
    $events = $stmt->fetchAll();

    // Decode JSON fields
    foreach ($events as &$event) {
        if (isset($event['sub_categories'])) {
            $event['sub_categories'] = json_decode($event['sub_categories'], true);
        }
        if (isset($event['ticketTypes'])) {
            $event['ticketTypes'] = json_decode($event['ticketTypes'], true);
        }
    }

    echo json_encode($events);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
