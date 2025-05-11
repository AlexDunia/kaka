# Paystack Integration Setup Guide

This guide will help you set up and test the Paystack payment integration for your event ticketing system.

## Prerequisites

- PHP 7.4+ with PDO and cURL extensions
- Your existing event database (MySQL/MariaDB)
- Node.js and npm (for the Vue.js frontend)
- A Paystack account (test or live)

## 1. Frontend Setup

### 1.1. Add the Paystack Script

Add the Paystack script to your Vue.js application's `index.html` file (usually in the `public` folder) before the closing `</body>` tag:

```html
<script src="https://js.paystack.co/v1/inline.js"></script>
```

### 1.2. Update Your Paystack Public Key

In `src/pages/Checkout.vue`, ensure your Paystack public key is correctly set:

```javascript
const paystackPublicKey = 'pk_test_a23671022344a4de4ca87e5b42f68b3f5d84bfd9'
```

Replace this with your live public key when going to production.

## 2. Backend Setup

### 2.1. Database Configuration

1. Before running the setup script, update the database connection details in `db_setup.php`:

   ```php
   $host = 'localhost';
   $username = 'root';
   $password = '';
   $dbname = 'your_existing_event_db'; // CHANGE THIS to your existing event database name
   ```

2. Run the `db_setup.php` script to add the transactions table to your existing event database:

   ```bash
   php db_setup.php
   ```

   This script will:

   - Connect to your existing event database
   - Create the `transactions` table with all required fields
   - Attempt to link the transactions table to your events table (if it exists)
   - Display the setup status

### 2.2. Update Payment Processing Configuration

Open `payment.php` and update the configuration to match your database and Paystack account:

```php
// Database configuration
$dbHost = 'localhost';
$dbName = 'your_existing_event_db'; // CHANGE THIS to your existing event database name
$dbUser = 'root';
$dbPass = '';

// Paystack configuration
$paystackSecretKey = 'sk_test_XXXXXXXXXXXXXXXXXXXX'; // Replace with your actual secret key
```

**IMPORTANT**: Never expose your secret key in the frontend code or push it to a public repository.

## 3. Integration with Your Existing Events System

### 3.1. How It Links to Your Events Table

The transactions table is designed to work with your existing events system:

- The `event_id` column in the transactions table can link to your events table
- The script attempts to create a foreign key relationship if your events table has a primary key
- The frontend sends event IDs to the backend when processing payments
- Transaction details stored in the database include all event and ticket information

### 3.2. Payment Flow

1. Customer selects events and tickets and proceeds to checkout
2. Customer completes the form on the checkout page and clicks "Complete Purchase"
3. Paystack popup appears for payment details
4. Upon successful payment:
   - Frontend sends payment reference and event details to the backend
   - Backend verifies the payment with Paystack
   - Backend stores transaction details in your database
   - Backend generates and returns ticket IDs
   - Frontend displays success message and redirects customer

## 4. Testing the Integration

### 4.1. Start Your Frontend

Start your Vue.js development server:

```bash
npm run dev
```

### 4.2. Place the PHP Files

Ensure the following PHP files are in your server's document root or accessible via your web server:

- `payment.php` - Main endpoint for payment verification
- `db_setup.php` - Used to set up the database

### 4.3. Make a Test Payment

1. Go to the checkout page of your application
2. Fill in the form details
3. Click "Complete Purchase"
4. You should see the Paystack popup
5. Use Paystack's test card details:
   - Card Number: `4084 0840 8408 4081`
   - CVV: Any 3 digits
   - Expiry Date: Any future date
   - PIN: `0000`
   - OTP: `123456`

### 4.4. Verify Transaction in Database

After a successful test payment, check your database to confirm the transaction was recorded:

```sql
SELECT * FROM transactions ORDER BY id DESC LIMIT 1;
```

You should see all the transaction details including:

- The event ID linking to your events table
- Customer information
- Payment details
- Generated ticket IDs

## 5. Going Live

When you're ready to go live with your Paystack integration:

1. Replace the test public key in `Checkout.vue` with your live public key
2. Replace the test secret key in `payment.php` with your live secret key
3. Update the CORS configuration in `payment.php` to allow only your production domain:
   ```php
   header('Access-Control-Allow-Origin: https://your-production-domain.com');
   ```
4. Ensure your server has HTTPS enabled for secure transactions

## 6. Troubleshooting

### 6.1. Payment Not Processing

- Check browser console for JavaScript errors
- Ensure the Paystack script is properly loaded
- Verify your public key is correct

### 6.2. Transaction Not Saving to Database

- Check if `payment.php` is accessible from your frontend
- Verify database connection details
- Check PHP error logs for any issues
- Ensure your Paystack test secret key is correct

### 6.3. CORS Issues

If you're getting CORS errors when your frontend tries to verify the payment:

- Update the CORS headers in `payment.php` to match your frontend URL:
  ```php
  header('Access-Control-Allow-Origin: http://localhost:5173'); // Adjust as needed
  ```

## 7. Database Structure

The `transactions` table has the following key fields:

- `id`: Auto-incrementing primary key
- `event_id`: Foreign key linking to your events table
- `paystack_reference`: Unique Paystack transaction reference
- `customer_name`: Full name of the customer
- `customer_email`: Email of the customer
- `customer_phone`: Phone number of the customer
- `ticket_details`: JSON data with details of purchased tickets
- `ids_generated`: Comma-separated list of generated ticket IDs
- `amount`: Total amount paid in major currency unit (e.g., Naira)
- `card_details`: Card information (e.g., "VISA Ending with 4081")
- `status`: Transaction status (e.g., "success", "failed")

For a complete list of fields, check the database schema in `db_setup.php`.
