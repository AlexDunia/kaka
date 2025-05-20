<?php
// Database connection details
$db_host = 'localhost';
$db_name = 'events_ticketing'; // Change this to your database name
$db_user = 'root';             // Change this to your database username
$db_pass = '';                 // Change this to your database password

$host = 'localhost';
$port = 3307; // You're using MySQL on port 3307
$db   = 'events';
$user = 'root';
$pass = ''; // Add your actual password here if any
$charset = 'utf8mb4';

// Create database connection
function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_pass;
    
    try {
        $db = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $db;
    } catch(PDOException $e) {
        // Log error rather than exposing details
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// Function to check if connection is successful
function isDatabaseConnected() {
    $db = getDbConnection();
    return $db !== null;
} 