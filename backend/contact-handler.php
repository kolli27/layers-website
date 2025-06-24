<?php
/**
 * Layers Ceramics Studio - Contact Form Handler
 * Handles contact form submissions and booking requests
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers for frontend requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit();
}

// Configuration
$config = [
    'email' => [
        'to' => 'info@layers-koeln.de',
        'from' => 'noreply@layers-koeln.de',
        'reply_to' => '',
        'subject_prefix' => '[Layers Studio] '
    ],
    'database' => [
        'host' => 'localhost',
        'dbname' => 'layers_studio',
        'username' => 'layers_user',
        'password' => 'secure_password_here'
    ],
    'recaptcha' => [
        'secret_key' => 'your_recaptcha_secret_key_here'
    ]
];

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email address
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (German format)
 */
function isValidPhone($phone) {
    // Remove spaces and special characters
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    // Check if it's a valid German phone number
    return preg_match('/^(\+49|0)[1-9][0-9]{7,11}$/', $phone);
}

/**
 * Send email using PHPMailer or built-in mail function
 */
function sendEmail($to, $subject, $body, $from = null, $replyTo = null) {
    global $config;
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: ' . ($from ?: $config['email']['from']),
        'X-Mailer: PHP/' . phpversion()
    ];
    
    if ($replyTo) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    
    return mail($to, $subject, $body, implode("\r\n", $headers));
}

/**
 * Save contact/booking to database
 */
function saveToDatabase($data) {
    global $config;
    
    try {
        $pdo = new PDO(
            "mysql:host={$config['database']['host']};dbname={$config['database']['dbname']};charset=utf8mb4",
            $config['database']['username'],
            $config['database']['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $sql = "INSERT INTO contacts (
            type, name, email, phone, subject, message, 
            booking_type, booking_date, booking_time, booking_persons,
            group_type, group_date, group_persons, group_message,
            created_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['type'] ?? 'contact',
            $data['name'],
            $data['email'],
            $data['phone'] ?? null,
            $data['subject'] ?? null,
            $data['message'] ?? null,
            $data['booking_type'] ?? null,
            $data['booking_date'] ?? null,
            $data['booking_time'] ?? null,
            $data['booking_persons'] ?? null,
            $data['group_type'] ?? null,
            $data['group_date'] ?? null,
            $data['group_persons'] ?? null,
            $data['group_message'] ?? null,
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT']
        ]);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

/**
 * Generate email templates
 */
function getEmailTemplate($type, $data) {
    $baseTemplate = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #2C3E50; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #E1E8ED; }
            .footer { background: #F8F9FA; padding: 20px; text-align: center; font-size: 12px; }
            .highlight { color: #FF6B35; font-weight: bold; }
            .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid #E1E8ED; }
            .data-table th { background: #F8F9FA; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Layers Ceramics Studio</h1>
            </div>
            <div class="content">
                {{CONTENT}}
            </div>
            <div class="footer">
                <p>Layers Ceramics Studio<br>
                Musterstraße 123, 50667 Köln<br>
                Tel: 0221 123 456 78 | E-Mail: info@layers-koeln.de</p>
            </div>
        </div>
    </body>
    </html>';
    
    switch ($type) {
        case 'contact':
            $content = "<h2>Neue Kontaktanfrage</h2>
            <p>Es ist eine neue Nachricht über das Kontaktformular eingegangen:</p>
            <table class='data-table'>
                <tr><th>Name:</th><td>{$data['name']}</td></tr>
                <tr><th>E-Mail:</th><td>{$data['email']}</td></tr>";
            
            if (!empty($data['phone'])) {
                $content .= "<tr><th>Telefon:</th><td>{$data['phone']}</td></tr>";
            }
            if (!empty($data['subject'])) {
                $content .= "<tr><th>Betreff:</th><td>{$data['subject']}</td></tr>";
            }
            
            $content .= "<tr><th>Nachricht:</th><td>" . nl2br($data['message']) . "</td></tr>
            </table>
            <p><strong>Bitte antworte zeitnah auf diese Anfrage!</strong></p>";
            break;
            
        case 'booking_confirmation':
            $content = "<h2>Buchungsbestätigung</h2>
            <p>Liebe/r {$data['name']},</p>
            <p>vielen Dank für deine Buchung bei Layers! Wir haben deine Anfrage erhalten und werden uns innerhalb von 24 Stunden bei dir melden.</p>
            
            <h3>Deine Buchungsdaten:</h3>
            <table class='data-table'>";
            
            if ($data['booking_type'] === 'walk-in') {
                $content .= "
                <tr><th>Art:</th><td>Offenes Atelier</td></tr>
                <tr><th>Datum:</th><td>{$data['booking_date']}</td></tr>
                <tr><th>Uhrzeit:</th><td>{$data['booking_time']} Uhr</td></tr>
                <tr><th>Personen:</th><td>{$data['booking_persons']}</td></tr>";
            } else {
                $content .= "
                <tr><th>Art:</th><td>Gruppenevent - {$data['group_type']}</td></tr>
                <tr><th>Wunschdatum:</th><td>{$data['group_date']}</td></tr>
                <tr><th>Personen:</th><td>{$data['group_persons']}</td></tr>";
                if (!empty($data['group_message'])) {
                    $content .= "<tr><th>Nachricht:</th><td>" . nl2br($data['group_message']) . "</td></tr>";
                }
            }
            
            $content .= "</table>
            <p><strong>Nächste Schritte:</strong></p>
            <ul>
                <li>Wir bestätigen deine Buchung per E-Mail oder Telefon</li>
                <li>Bei Gruppenbuchungen besprechen wir individuelle Details</li>
                <li>Du erhältst alle Informationen zu Ablauf und Bezahlung</li>
            </ul>
            <p>Bei Fragen erreichst du uns unter <a href='tel:+4922112345678'>0221 123 456 78</a>.</p>
            <p>Wir freuen uns auf dich!</p>
            <p>Dein Layers Team</p>";
            break;
            
        default:
            $content = "<h2>Neue Nachricht</h2><p>Es ist eine neue Nachricht eingegangen.</p>";
    }
    
    return str_replace('{{CONTENT}}', $content, $baseTemplate);
}

// Main processing
try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Determine request type
    $requestType = $input['type'] ?? 'contact';
    
    // Validate required fields
    if (empty($input['name']) || empty($input['email'])) {
        throw new Exception('Name und E-Mail sind Pflichtfelder');
    }
    
    if (!isValidEmail($input['email'])) {
        throw new Exception('Bitte gib eine gültige E-Mail-Adresse ein');
    }
    
    // Sanitize all input data
    $data = [];
    foreach ($input as $key => $value) {
        if (is_string($value)) {
            $data[$key] = sanitizeInput($value);
        } else {
            $data[$key] = $value;
        }
    }
    
    // Additional validation for phone if provided
    if (!empty($data['phone']) && !isValidPhone($data['phone'])) {
        throw new Exception('Bitte gib eine gültige Telefonnummer ein');
    }
    
    // Process based on request type
    $success = false;
    $confirmationSent = false;
    
    switch ($requestType) {
        case 'contact':
            // Save to database
            $saved = saveToDatabase($data);
            
            // Send notification email to studio
            $subject = $config['email']['subject_prefix'] . 'Neue Kontaktanfrage';
            if (!empty($data['subject'])) {
                $subject .= ' - ' . $data['subject'];
            }
            
            $emailBody = getEmailTemplate('contact', $data);
            $success = sendEmail($config['email']['to'], $subject, $emailBody, null, $data['email']);
            break;
            
        case 'booking':
            // Save booking to database
            $saved = saveToDatabase($data);
            
            // Send notification to studio
            $subject = $config['email']['subject_prefix'] . 'Neue Buchungsanfrage';
            if ($data['booking_type'] === 'walk-in') {
                $subject .= ' - Offenes Atelier';
            } else {
                $subject .= ' - Gruppenevent';
            }
            
            $studioEmailBody = getEmailTemplate('contact', $data);
            $success = sendEmail($config['email']['to'], $subject, $studioEmailBody, null, $data['email']);
            
            // Send confirmation to customer
            $confirmationSubject = 'Buchungsbestätigung - Layers Ceramics Studio';
            $confirmationBody = getEmailTemplate('booking_confirmation', $data);
            $confirmationSent = sendEmail($data['email'], $confirmationSubject, $confirmationBody);
            break;
            
        default:
            throw new Exception('Unbekannter Anfrage-Typ');
    }
    
    if (!$success) {
        throw new Exception('E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.');
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Deine Nachricht wurde erfolgreich gesendet!',
        'data' => [
            'type' => $requestType,
            'confirmation_sent' => $confirmationSent,
            'saved_to_database' => $saved ?? false
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    
    // Log error for debugging
    error_log("Contact form error: " . $e->getMessage() . " | Input: " . json_encode($input ?? []));
}
?>
