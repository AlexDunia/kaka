<?php
// Simple API test file to check response format
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        pre {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            overflow: auto;
        }
        h1, h2 {
            color: #333;
        }
        button {
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <h1>Events API Test</h1>
    
    <div>
        <button id="testBtn">Test API</button>
        <button id="clearBtn">Clear Results</button>
    </div>
    
    <h2>Response:</h2>
    <pre id="result">Click "Test API" to see response...</pre>

    <script>
        document.getElementById('testBtn').addEventListener('click', async () => {
            const resultElement = document.getElementById('result');
            resultElement.textContent = 'Loading...';
            
            try {
                // Test basic endpoint
                const response = await fetch('events.php');
                const data = await response.json();
                
                // Format and display the response
                resultElement.textContent = JSON.stringify(data, null, 2);
                
                // Check format
                if (data.data && Array.isArray(data.data) && data.pagination) {
                    resultElement.textContent += '\n\n✅ Response format is correct - contains data and pagination';
                } else {
                    resultElement.textContent += '\n\n❌ Response format is incorrect - missing data array or pagination';
                }
            } catch (error) {
                resultElement.textContent = `Error: ${error.message}`;
            }
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Results cleared.';
        });
    </script>
</body>
</html> 