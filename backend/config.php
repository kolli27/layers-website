<?php
// Backend configuration for Layers Ceramics Studio
// This file contains all configuration settings for local development

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'layers_ceramics');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Email Configuration (for development)
define('MAIL_HOST', 'localhost');
define('MAIL_PORT', 1025); // MailHog default port for testing
define('MAIL_USERNAME', '');
define('MAIL_PASSWORD', '');
define('MAIL_FROM_EMAIL', 'info@layers-ceramics.de');
define('MAIL_FROM_NAME', 'Layers Ceramics Studio');

// Site Configuration
define('SITE_URL', 'http://localhost:8080');
define('SITE_NAME', 'Layers Ceramics Studio');

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_PATH', __DIR__ . '/uploads/');

// Development Settings
define('DEBUG_MODE', true);
define('LOG_ERRORS', true);
define('ERROR_LOG_FILE', __DIR__ . '/logs/error.log');

// Payment Configuration (for testing)
define('PAYMENT_TEST_MODE', true);
define('PAYPAL_CLIENT_ID', 'your-paypal-client-id');
define('PAYPAL_CLIENT_SECRET', 'your-paypal-client-secret');
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_...');
define('STRIPE_SECRET_KEY', 'sk_test_...');

// Security Settings
define('CSRF_TOKEN_EXPIRY', 3600); // 1 hour
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_ATTEMPT_TIMEOUT', 900); // 15 minutes

// Voucher Settings
define('VOUCHER_CODE_LENGTH', 8);
define('VOUCHER_EXPIRY_MONTHS', 12);

// Booking Settings
define('BOOKING_ADVANCE_DAYS', 1); // Minimum days in advance for booking
define('BOOKING_MAX_DAYS', 90); // Maximum days in advance for booking

// Error logging function
function logError($message, $context = []) {
    if (LOG_ERRORS) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message";
        if (!empty($context)) {
            $logMessage .= " Context: " . json_encode($context);
        }
        $logMessage .= PHP_EOL;
        
        // Ensure log directory exists
        $logDir = dirname(ERROR_LOG_FILE);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents(ERROR_LOG_FILE, $logMessage, FILE_APPEND | LOCK_EX);
    }
}

// Database connection function
function getDatabase() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }
    
    return $pdo;
}

// Email sending function (development version)
function sendEmail($to, $subject, $htmlBody, $textBody = null) {
    if (DEBUG_MODE) {
        // In development mode, just log the email instead of sending
        logError('Email would be sent', [
            'to' => $to,
            'subject' => $subject,
            'body' => $htmlBody
        ]);
        return true;
    }
    
    // TODO: Implement actual email sending with PHPMailer or similar
    // For now, return true to simulate successful sending
    return true;
}

// Generate secure random string
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

// Generate voucher code
function generateVoucherCode() {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    
    for ($i = 0; $i < VOUCHER_CODE_LENGTH; $i++) {
        $code .= $characters[random_int(0, strlen($characters) - 1)];
    }
    
    return $code;
}

// Validate email address
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// JSON response helper
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Error response helper
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse(['error' => $message], $statusCode);
}

// Success response helper
function sendSuccessResponse($message, $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJsonResponse($response);
}
?>
