-- Create transactions table for Paystack payments
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample transaction (for testing/reference only)
-- Uncomment and run this if you want a sample transaction in your database
/*
INSERT INTO `transactions` (
    paystack_reference, order_reference, customer_name, customer_email,
    customer_phone, ticket_details, ticket_count, ids_generated,
    currency, amount, amount_kobo, payment_method, card_details,
    transaction_date, paystack_paid_at, channel, ip_address, status
) VALUES (
    'TD7936740188', 'cart-1234567890', 'ALEX DUNIA', 'alex@example.com',
    '08108725914', '[{"event_name":"Test Event 1746110913","ticket_type":"VIP Ticket","quantity":1}]',
    1, 'TIX-CA1223A5-001',
    'NGN', 15000.00, 1500000, 'card', 'VISA Ending with 4081',
    NOW(), NOW(), 'card', '127.0.0.1', 'success'
);
*/ 