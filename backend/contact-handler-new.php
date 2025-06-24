<?php
require_once __DIR__ . '/config.php';

// Enable error reporting for development
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Method not allowed', 405);
}

try {
    // Validate and sanitize input
    $requiredFields = ['type', 'firstname', 'lastname', 'email'];
    $data = [];
    
    foreach ($requiredFields as $field) {
        if (empty($_POST[$field])) {
            sendErrorResponse("Feld '$field' ist erforderlich");
        }
        $data[$field] = sanitizeInput($_POST[$field]);
    }
    
    // Validate email
    if (!isValidEmail($data['email'])) {
        sendErrorResponse('Ungültige E-Mail-Adresse');
    }
    
    // Optional fields
    $optionalFields = ['phone', 'subject', 'message', 'booking_type', 'booking_date', 'booking_time', 'participants', 'event_type'];
    foreach ($optionalFields as $field) {
        $data[$field] = isset($_POST[$field]) ? sanitizeInput($_POST[$field]) : '';
    }
    
    // Set default subject if not provided
    if (empty($data['subject'])) {
        $data['subject'] = ($data['type'] === 'booking') ? 'Buchungsanfrage' : 'Kontaktanfrage';
    }
    
    // Get database connection
    $pdo = getDatabase();
    
    // Insert into database
    if ($data['type'] === 'booking') {
        $sql = "INSERT INTO bookings (firstname, lastname, email, phone, booking_type, booking_date, booking_time, participants, event_type, message, status, created_at) 
                VALUES (:firstname, :lastname, :email, :phone, :booking_type, :booking_date, :booking_time, :participants, :event_type, :message, 'pending', NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'firstname' => $data['firstname'],
            'lastname' => $data['lastname'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'booking_type' => $data['booking_type'],
            'booking_date' => $data['booking_date'] ? $data['booking_date'] : null,
            'booking_time' => $data['booking_time'],
            'participants' => $data['participants'],
            'event_type' => $data['event_type'],
            'message' => $data['message']
        ]);
        
        $bookingId = $pdo->lastInsertId();
        
        // Send confirmation email
        $emailSubject = 'Buchungsbestätigung - Layers Ceramics Studio';
        $emailBody = generateBookingConfirmationEmail($data, $bookingId);
        
    } else {
        // Regular contact form
        $sql = "INSERT INTO contacts (firstname, lastname, email, phone, subject, message, status, created_at) 
                VALUES (:firstname, :lastname, :email, :phone, :subject, :message, 'new', NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'firstname' => $data['firstname'],
            'lastname' => $data['lastname'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'subject' => $data['subject'],
            'message' => $data['message']
        ]);
        
        $contactId = $pdo->lastInsertId();
        
        // Send confirmation email
        $emailSubject = 'Nachricht erhalten - Layers Ceramics Studio';
        $emailBody = generateContactConfirmationEmail($data, $contactId);
    }
    
    // Send email
    sendEmail($data['email'], $emailSubject, $emailBody);
    
    // Send success response
    $message = ($data['type'] === 'booking') ? 'Buchungsanfrage erfolgreich gesendet!' : 'Nachricht erfolgreich gesendet!';
    sendSuccessResponse($message);
    
} catch (PDOException $e) {
    logError('Database error in contact handler: ' . $e->getMessage());
    sendErrorResponse('Datenbankfehler aufgetreten', 500);
} catch (Exception $e) {
    logError('Error in contact handler: ' . $e->getMessage());
    sendErrorResponse('Ein Fehler ist aufgetreten', 500);
}

// Email template functions
function generateBookingConfirmationEmail($data, $bookingId) {
    $html = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #8B5A3C; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>Layers Ceramics Studio</h1>
            <p>Buchungsbestätigung</p>
        </div>
        <div class='content'>
            <p>Liebe/r {$data['firstname']},</p>
            <p>vielen Dank für deine Buchungsanfrage! Wir haben folgende Informationen erhalten:</p>
            
            <div class='booking-details'>
                <h3>Buchungsdetails (ID: #$bookingId)</h3>
                <p><strong>Name:</strong> {$data['firstname']} {$data['lastname']}</p>
                <p><strong>E-Mail:</strong> {$data['email']}</p>
                " . (!empty($data['phone']) ? "<p><strong>Telefon:</strong> {$data['phone']}</p>" : "") . "
                <p><strong>Buchungsart:</strong> " . ucfirst($data['booking_type']) . "</p>
                " . (!empty($data['booking_date']) ? "<p><strong>Wunschdatum:</strong> {$data['booking_date']}</p>" : "") . "
                " . (!empty($data['booking_time']) ? "<p><strong>Wunschzeit:</strong> {$data['booking_time']}</p>" : "") . "
                " . (!empty($data['participants']) ? "<p><strong>Teilnehmer:</strong> {$data['participants']}</p>" : "") . "
                " . (!empty($data['event_type']) ? "<p><strong>Event-Art:</strong> {$data['event_type']}</p>" : "") . "
                " . (!empty($data['message']) ? "<p><strong>Nachricht:</strong> {$data['message']}</p>" : "") . "
            </div>
            
            <h3>Nächste Schritte:</h3>
            <ul>
                <li>📧 Diese Bestätigungs-E-Mail</li>
                <li>📞 Rückruf binnen 24 Stunden zur finalen Terminabsprache</li>
                <li>🎨 Freue dich auf dein kreatives Erlebnis!</li>
            </ul>
            
            <p>Falls du noch Fragen hast, melde dich gerne bei uns!</p>
            <p>Liebe Grüße,<br>dein Layers-Team</p>
        </div>
        <div class='footer'>
            <p>Layers Ceramics Studio | Musterstraße 123 | 50667 Köln</p>
            <p>Tel: 0221 123456 | E-Mail: info@layers-ceramics.de</p>
        </div>
    </body>
    </html>";
    
    return $html;
}

function generateContactConfirmationEmail($data, $contactId) {
    $html = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #8B5A3C; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .message-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>Layers Ceramics Studio</h1>
            <p>Nachricht erhalten</p>
        </div>
        <div class='content'>
            <p>Liebe/r {$data['firstname']},</p>
            <p>vielen Dank für deine Nachricht! Wir haben sie erhalten und werden uns binnen 24 Stunden bei dir melden.</p>
            
            <div class='message-details'>
                <h3>Deine Nachricht (ID: #$contactId)</h3>
                <p><strong>Name:</strong> {$data['firstname']} {$data['lastname']}</p>
                <p><strong>E-Mail:</strong> {$data['email']}</p>
                " . (!empty($data['phone']) ? "<p><strong>Telefon:</strong> {$data['phone']}</p>" : "") . "
                <p><strong>Betreff:</strong> {$data['subject']}</p>
                <p><strong>Nachricht:</strong> {$data['message']}</p>
            </div>
            
            <p>Falls es dringend ist, kannst du uns auch telefonisch erreichen!</p>
            <p>Liebe Grüße,<br>dein Layers-Team</p>
        </div>
        <div class='footer'>
            <p>Layers Ceramics Studio | Musterstraße 123 | 50667 Köln</p>
            <p>Tel: 0221 123456 | E-Mail: info@layers-ceramics.de</p>
        </div>
    </body>
    </html>";
    
    return $html;
}
?>
