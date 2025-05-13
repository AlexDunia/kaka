# Paystack Payment Backend

A simple PHP backend for handling Paystack payment verification for your event ticketing system.

## Setup Instructions

1. **Create .env file**

   Create a file named `.env` in the backend directory with the following contents:

   ```
   # Paystack API Keys
   PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key_here
   PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key_here

   # Database Configuration
   DB_HOST=localhost
   DB_NAME=event_tickets
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   ```

   Replace the placeholder values with your actual Paystack API keys and database credentials.

2. **Database Setup**

   Create a MySQL database named `event_tickets` (or use the name you specified in the .env file).
   The tables will be created automatically when the backend is first accessed.

3. **Server Requirements**

   - PHP 7.4 or later
   - MySQL 5.7 or later
   - cURL extension enabled
   - PDO extension enabled

4. **Deployment**

   Upload the backend directory to your web server. Make sure the web server has write permissions
   for the backend directory to create the `transactions` and `tickets` directories.

5. **Configuring Frontend**

   Update your frontend to use the correct backend URL:

   ```javascript
   // In your Vue.js environment variables (.env file)
   VITE_BACKEND_URL=https://your-domain.com/backend
   ```

6. **Testing**

   Use Paystack test keys for development and testing. Only switch to live keys when you're ready
   to process real payments.

## Security Considerations

- Never expose your Paystack secret key in your frontend code
- Always verify payments on your backend
- Use HTTPS for all payment-related requests
- Implement proper error handling and logging
- Regularly back up your database

## Files Overview

- **verify-payment.php**: Handles payment verification with Paystack API
- **db-config.php**: Database connection and helper functions
- **.htaccess**: Web server configuration for security
- **.env**: Environment variables (create this file yourself)

## Customization

You can customize the backend to fit your specific needs:

- Add more fields to the database tables in `db-config.php`
- Implement email notifications in `verify-payment.php`
- Add additional API endpoints for ticket management
- Implement user authentication for ticket viewing
