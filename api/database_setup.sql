-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) NOT NULL UNIQUE,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) DEFAULT 'Paystack'
);

-- Create tickets table (for individual ticket items)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL UNIQUE,
    transaction_reference VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(100) NOT NULL,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    holder_name VARCHAR(200) NOT NULL,
    holder_email VARCHAR(100) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (transaction_reference) REFERENCES transactions(reference)
);

-- Create an index for faster lookups
CREATE INDEX idx_transaction_reference ON tickets(transaction_reference);
CREATE INDEX idx_ticket_id ON tickets(ticket_id);
CREATE INDEX idx_holder_email ON tickets(holder_email); 