<?php
// Simple PHP development server router
// Handles CORS and routing for the Layers website

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers for local development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the requested URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route backend requests
if (strpos($uri, '/backend/') === 0) {
    // Remove /backend/ prefix and route to the actual file
    $file = __DIR__ . $uri;
    
    if (file_exists($file) && is_file($file)) {
        // Set content type for JSON responses
        if (strpos($file, '.php') !== false) {
            header('Content-Type: application/json');
        }
        
        // Include the PHP file
        include $file;
        exit();
    } else {
        // Backend file not found
        http_response_code(404);
        echo json_encode(['error' => 'Backend endpoint not found']);
        exit();
    }
}

// Serve static files or default to index.html
$staticFile = __DIR__ . $uri;

if ($uri === '/' || $uri === '') {
    $staticFile = __DIR__ . '/new-index.html';
} elseif ($uri === '/gruppenevents' || $uri === '/gruppenevents/') {
    $staticFile = __DIR__ . '/new-gruppenevents.html';
} elseif ($uri === '/gutscheine' || $uri === '/gutscheine/') {
    $staticFile = __DIR__ . '/new-gutscheine.html';
} elseif ($uri === '/kontakt' || $uri === '/kontakt/') {
    $staticFile = __DIR__ . '/new-kontakt.html';
}

if (file_exists($staticFile) && is_file($staticFile)) {
    // Determine content type
    $ext = pathinfo($staticFile, PATHINFO_EXTENSION);
    $contentType = 'text/html';
    
    switch ($ext) {
        case 'css':
            $contentType = 'text/css';
            break;
        case 'js':
            $contentType = 'application/javascript';
            break;
        case 'json':
            $contentType = 'application/json';
            break;
        case 'png':
            $contentType = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            $contentType = 'image/jpeg';
            break;
        case 'gif':
            $contentType = 'image/gif';
            break;
        case 'svg':
            $contentType = 'image/svg+xml';
            break;
        case 'avif':
            $contentType = 'image/avif';
            break;
    }
    
    header('Content-Type: ' . $contentType);
    readfile($staticFile);
} else {
    // File not found, serve 404
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested file was not found.</p></body></html>';
}
?>
