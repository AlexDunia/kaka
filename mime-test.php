<?php
// Output the current URL
echo "Testing URL: " . $_SERVER['REQUEST_URI'] . "<br>";

// Create a path for testing
$test_path = dirname($_SERVER['SCRIPT_FILENAME']) . '/src/main.js';
if (file_exists($test_path)) {
    echo "main.js exists on server at: $test_path <br>";
    
    // Get the mime type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $test_path);
    finfo_close($finfo);
    
    echo "Detected MIME type: $mime <br>";
} else {
    echo "main.js file not found at: $test_path <br>";
    echo "Current script path: " . $_SERVER['SCRIPT_FILENAME'] . "<br>";
    
    // List files in the directory
    echo "Files in current directory:<br>";
    $files = scandir(dirname($_SERVER['SCRIPT_FILENAME']));
    echo "<pre>";
    print_r($files);
    echo "</pre>";
}

// Check for mod_rewrite
if (function_exists('apache_get_modules')) {
    echo "Apache modules:<br><pre>";
    print_r(apache_get_modules());
    echo "</pre>";
} else {
    echo "Cannot determine Apache modules - likely running in CGI/FastCGI mode<br>";
}

// Output server software
echo "Server software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
?> 