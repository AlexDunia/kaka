<?php
/**
 * Database Setup Script for Events Ticketing System
 * 
 * This script will add the transactions table to your existing events database
 */

// Include database configuration
require_once 'api/db_config.php';
// We'll use the second set of credentials ($host, $port, $db, $user, $pass, $charset)

// Output header
echo "===================================\n";
echo "Adding Transactions Table to Event Database\n";
echo "===================================\n\n";

try {
    // Connect to the existing database using credentials from db_config.php (second set)
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to existing database '$db' successfully\n";
    
    // Check if the transactions table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'transactions'");
    $tableExists = $stmt->fetchColumn();
    
    if (!$tableExists) {
        echo "→ Table 'transactions' does not exist. Creating it...\n";
        
        // Create the transactions table
        $sql = "CREATE TABLE IF NOT EXISTS `transactions` (
            `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `event_id` BIGINT UNSIGNED NULL COMMENT 'Foreign key to events table if needed',
            `paystack_reference` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Paystack transaction reference',
            `order_reference` VARCHAR(255) NULL COMMENT 'Your internal order/cart reference, if any',
            `customer_name` VARCHAR(255) NOT NULL,
            `customer_email` VARCHAR(255) NOT NULL,
            `customer_phone` VARCHAR(50) NULL,
            `ticket_details` JSON NULL COMMENT 'Details of tickets purchased, as JSON array',
            `ids_generated` VARCHAR(255) NULL COMMENT 'Comma-separated generated ticket IDs like TIX-CA1223A5-001',
            `ticket_count` INT UNSIGNED NULL COMMENT 'Total number of tickets in this transaction',
            `currency` VARCHAR(3) NOT NULL DEFAULT 'NGN',
            `amount` DECIMAL(15, 2) NOT NULL COMMENT 'Total amount paid, in major currency unit (e.g., Naira)',
            `amount_kobo` INT UNSIGNED NOT NULL COMMENT 'Total amount paid, in minor currency unit (e.g., Kobo)',
            `payment_method` VARCHAR(100) NULL COMMENT 'e.g., card, bank_transfer',
            `card_details` VARCHAR(100) NULL COMMENT 'e.g., VISA Ending with 4081',
            `transaction_date` DATETIME NOT NULL COMMENT 'Date and time of the transaction from our system',
            `paystack_paid_at` DATETIME NULL COMMENT 'Timestamp when Paystack confirmed payment',
            `channel` VARCHAR(50) NULL COMMENT 'Payment channel, e.g., card, bank',
            `ip_address` VARCHAR(45) NULL COMMENT 'IP address of the customer',
            `status` VARCHAR(50) NOT NULL COMMENT 'e.g., success, failed, abandoned',
            `paystack_log` JSON NULL COMMENT 'Full Paystack transaction object for reference/audit',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_customer_email` (`customer_email`),
            INDEX `idx_transaction_date` (`transaction_date`),
            INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($sql);
        echo "✓ Table 'transactions' created successfully\n";
        
        // Check if events table exists to add a foreign key
        $stmt = $pdo->query("SHOW TABLES LIKE 'events'");
        $eventsTableExists = $stmt->fetchColumn();
        
        if ($eventsTableExists) {
            // Get the primary key column of the events table
            $stmt = $pdo->query("SHOW KEYS FROM `events` WHERE Key_name = 'PRIMARY'");
            $primaryKeyInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($primaryKeyInfo && isset($primaryKeyInfo['Column_name'])) {
                $eventsPrimaryKey = $primaryKeyInfo['Column_name'];
                
                echo "→ Adding foreign key to link transactions with events table...\n";
                
                try {
                    // Add foreign key constraint
                    $sql = "ALTER TABLE `transactions` 
                            ADD CONSTRAINT `fk_transaction_event` 
                            FOREIGN KEY (`event_id`) 
                            REFERENCES `events` (`$eventsPrimaryKey`) 
                            ON DELETE SET NULL ON UPDATE CASCADE";
                    
                    $pdo->exec($sql);
                    echo "✓ Foreign key constraint added successfully\n";
                } catch (PDOException $e) {
                    echo "⚠ Could not add foreign key: " . $e->getMessage() . "\n";
                    echo "→ This is not critical. You can still use the transactions table.\n";
                }
            } else {
                echo "⚠ Could not determine primary key of events table. Foreign key not added.\n";
            }
        } else {
            echo "⚠ No events table found. Foreign key not added.\n";
        }
    } else {
        echo "✓ Table 'transactions' already exists\n";
    }
    
    echo "\n";
    echo "✓ Setup completed successfully!\n";
    echo "\nTo start using the system:\n";
    echo "1. Make sure to update your Paystack secret key in payment.php\n";
    echo "2. Database configuration is now taken from api/db_config.php\n";
    echo "3. Add the Paystack script to your index.html\n";
    echo "4. Test a checkout with the provided Vue.js integration\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
}
?> 