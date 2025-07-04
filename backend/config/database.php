<?php
class Database {
    private static $instance = null;
    private $conn;
    
    private function __construct() {
        try {
            $config = [
                'host' => getenv('DB_HOST') ?: 'localhost',
                'dbname' => getenv('DB_NAME') ?: 'your_database_name',
                'user' => getenv('DB_USER') ?: 'your_username',
                'pass' => getenv('DB_PASS') ?: 'your_password'
            ];
            
            $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $config['user'], $config['pass'], $options);
        } catch(PDOException $e) {
            error_log("Connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    // Prevent cloning of the instance
    private function __clone() {}
    
    // Prevent unserializing of the instance
    private function __wakeup() {}
} 