# Troubleshooting "Failed to fetch" Errors

If you're seeing "Network error: Failed to fetch" in your checkout page, follow these steps to diagnose and fix the issue:

## 1. Verify Your PHP Server is Running

Make sure your web server (XAMPP, WAMP, etc.) is running and accessible:

1. Open your browser and go to: `http://localhost/`
2. You should see your web server's default page
3. If not, start your web server from the control panel

## 2. Test the API Endpoint

Check if your PHP API is accessible:

1. Open your browser and go to: `http://localhost/api/test.php`
2. You should see a JSON response with "status": "success"
3. If you get a 404 error, your API folder path might be incorrect

## 3. Check File Permissions

Make sure your PHP files have the correct permissions:

1. Right-click on the `api` folder
2. Select Properties/Permissions
3. Ensure the web server has read and execute permissions

## 4. Review Server Error Logs

Check error logs for specific issues:

1. Look in your web server's error log:
   - XAMPP: `xampp/apache/logs/error.log`
   - WAMP: `wamp/logs/apache_error.log`
2. Check your payment error log: `api/payment_errors.log`

## 5. Verify Database Setup

Make sure your database is configured correctly:

1. Open phpMyAdmin (typically at `http://localhost/phpmyadmin`)
2. Check if your database exists (`events_ticketing` by default)
3. Verify tables are created (transactions and tickets)
4. Confirm your database user has proper permissions

## 6. Common Issues & Solutions

### CORS Errors

If you see CORS errors in your browser console:

- Check that your PHP files have the proper headers
- Try accessing the API from the same origin

### Wrong File Path

If your API can't be found:

- Make sure the files are in the correct location (`api/payments.php`)
- Check for typos in the URL

### PHP Version Issues

If your PHP code isn't running correctly:

- Check your PHP version with `<?php echo phpversion(); ?>`
- Make sure it's 7.0 or higher

### Database Connection Issues

If database connections fail:

- Verify credentials in `db_config.php`
- Check if MySQL service is running

## 7. Alternative API URLs to Try

If you're still having issues, try these alternative URLs in your Checkout.vue file:

```javascript
// Try each of these URLs:
const apiUrl = 'http://localhost/api/payments.php'
// const apiUrl = 'http://127.0.0.1/api/payments.php';
// const apiUrl = './api/payments.php';
// const apiUrl = 'http://localhost:80/api/payments.php';
```
