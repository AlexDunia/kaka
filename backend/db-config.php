<?php
/**
 * Database configuration for Paystack integration
 * 
 * This file handles database connection and provides helper functions
 * for storing and retrieving payment and ticket data.
 */

// Load environment variables
$env = parse_ini_file('.env');

// Database configuration
$dbHost = $env['DB_HOST'] ?? 'localhost';
$dbName = $env['DB_NAME'] ?? 'event_tickets';
$dbUser = $env['DB_USER'] ?? 'root';
$dbPass = $env['DB_PASSWORD'] ?? '';

/**
 * Create a database connection
 * 
 * @return mysqli|false Database connection or false on failure
 */
function getDbConnection() {
    global $dbHost, $dbName, $dbUser, $dbPass;
    
    $conn = new mysqli($dbHost, $dbName, $dbUser, $dbPass);
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        return false;
    }
    
    return $conn;
}

/**
 * Create required database tables if they don't exist
 * 
 * @return bool Whether tables were created successfully
 */
function createTables() {
    $conn = getDbConnection();
    
    if (!$conn) {
        return false;
    }
    
    // Create transactions table
    $transactionsTableSql = "CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reference VARCHAR(100) NOT NULL UNIQUE,
        paystack_ref VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL,
        payment_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    // Create tickets table
    $ticketsTableSql = "CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id VARCHAR(100) NOT NULL UNIQUE,
        transaction_reference VARCHAR(100) NOT NULL,
        event_title VARCHAR(255) NOT NULL,
        ticket_type VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        issue_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_reference) REFERENCES transactions(reference)
    )";
    
    $result1 = $conn->query($transactionsTableSql);
    $result2 = $conn->query($ticketsTableSql);
    
    $conn->close();
    
    return $result1 && $result2;
}

/**
 * Save transaction to database
 * 
 * @param array $transaction Transaction data from Paystack
 * @return bool|string Transaction reference on success, false on failure
 */
function saveTransactionToDb($transaction) {
    $conn = getDbConnection();
    
    if (!$conn) {
        return false;
    }
    
    // Extract transaction data
    $reference = $conn->real_escape_string($transaction['reference']);
    $paystackRef = $conn->real_escape_string($transaction['id']);
    $amount = $transaction['amount'] / 100; // Convert from kobo to naira
    $currency = $conn->real_escape_string($transaction['currency']);
    $customerEmail = $conn->real_escape_string($transaction['customer']['email']);
    $customerName = $conn->real_escape_string(
        $transaction['metadata']['customer_details']['first_name'] . ' ' . 
        $transaction['metadata']['customer_details']['last_name']
    );
    $customerPhone = $conn->real_escape_string($transaction['metadata']['customer_details']['phone']);
    $paymentStatus = $conn->real_escape_string($transaction['status']);
    $paymentDate = $conn->real_escape_string($transaction['paid_at']);
    
    // Prepare SQL
    $sql = "INSERT INTO transactions 
            (reference, paystack_ref, amount, currency, customer_email, customer_name, 
             customer_phone, payment_status, payment_date) 
            VALUES 
            ('$reference', '$paystackRef', $amount, '$currency', '$customerEmail', 
             '$customerName', '$customerPhone', '$paymentStatus', '$paymentDate')";
    
    // Execute query
    if ($conn->query($sql) === TRUE) {
        $conn->close();
        return $reference;
    } else {
        error_log("Error saving transaction: " . $conn->error);
        $conn->close();
        return false;
    }
}

/**
 * Save ticket to database
 * 
 * @param array $ticket Ticket data
 * @param string $transactionReference Reference to the parent transaction
 * @return bool Whether ticket was saved successfully
 */
function saveTicketToDb($ticket, $transactionReference) {
    $conn = getDbConnection();
    
    if (!$conn) {
        return false;
    }
    
    // Extract ticket data
    $ticketId = $conn->real_escape_string($ticket['ticketId']);
    $reference = $conn->real_escape_string($transactionReference);
    $eventTitle = $conn->real_escape_string($ticket['eventTitle']);
    $ticketType = $conn->real_escape_string($ticket['ticketType']);
    $customerEmail = $conn->real_escape_string($ticket['customerEmail']);
    $customerName = $conn->real_escape_string($ticket['customerName']);
    $issueDate = $conn->real_escape_string($ticket['issueDate']);
    
    // Prepare SQL
    $sql = "INSERT INTO tickets 
            (ticket_id, transaction_reference, event_title, ticket_type, 
             customer_email, customer_name, issue_date) 
            VALUES 
            ('$ticketId', '$reference', '$eventTitle', '$ticketType', 
             '$customerEmail', '$customerName', '$issueDate')";
    
    // Execute query
    if ($conn->query($sql) === TRUE) {
        $conn->close();
        return true;
    } else {
        error_log("Error saving ticket: " . $conn->error);
        $conn->close();
        return false;
    }
}

/**
 * Get transaction by reference
 * 
 * @param string $reference Transaction reference
 * @return array|false Transaction data or false if not found
 */
function getTransactionByReference($reference) {
    $conn = getDbConnection();
    
    if (!$conn) {
        return false;
    }
    
    $reference = $conn->real_escape_string($reference);
    
    $sql = "SELECT * FROM transactions WHERE reference = '$reference'";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $transaction = $result->fetch_assoc();
        $conn->close();
        return $transaction;
    } else {
        $conn->close();
        return false;
    }
}

/**
 * Get tickets by transaction reference
 * 
 * @param string $reference Transaction reference
 * @return array Tickets for the transaction
 */
function getTicketsByTransaction($reference) {
    $conn = getDbConnection();
    
    if (!$conn) {
        return [];
    }
    
    $reference = $conn->real_escape_string($reference);
    
    $sql = "SELECT * FROM tickets WHERE transaction_reference = '$reference'";
    $result = $conn->query($sql);
    
    $tickets = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $tickets[] = $row;
        }
    }
    
    $conn->close();
    return $tickets;
}

// Create tables when this file is included
createTables();
?> 