<?php
/**
 * Layers Ceramics Studio - Voucher Handler
 * Handles voucher purchases and generation
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
$config = [
    'database' => [
        'host' => 'localhost',
        'dbname' => 'layers_studio',
        'username' => 'layers_user',
        'password' => 'secure_password_here'
    ],
    'paypal' => [
        'mode' => 'sandbox', // 'live' for production
        'client_id' => 'your_paypal_client_id',
        'client_secret' => 'your_paypal_client_secret'
    ],
    'stripe' => [
        'publishable_key' => 'pk_test_your_stripe_publishable_key',
        'secret_key' => 'sk_test_your_stripe_secret_key'
    ],
    'email' => [
        'from' => 'gutscheine@layers-koeln.de',
        'studio' => 'info@layers-koeln.de'
    ]
];

/**
 * Database connection
 */
function getDatabase() {
    global $config;
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host={$config['database']['host']};dbname={$config['database']['dbname']};charset=utf8mb4",
                $config['database']['username'],
                $config['database']['password'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            throw new Exception('Datenbankverbindung fehlgeschlagen');
        }
    }
    
    return $pdo;
}

/**
 * Generate unique voucher code
 */
function generateVoucherCode($length = 12) {
    $characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    $code = '';
    
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[random_int(0, strlen($characters) - 1)];
    }
    
    // Format as XXXX-XXXX-XXXX
    return substr($code, 0, 4) . '-' . substr($code, 4, 4) . '-' . substr($code, 8, 4);
}

/**
 * Check if voucher code is unique
 */
function isVoucherCodeUnique($code) {
    $pdo = getDatabase();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM vouchers WHERE voucher_code = ?");
    $stmt->execute([$code]);
    return $stmt->fetchColumn() == 0;
}

/**
 * Create voucher in database
 */
function createVoucher($data) {
    $pdo = getDatabase();
    
    // Generate unique code
    do {
        $voucherCode = generateVoucherCode();
    } while (!isVoucherCodeUnique($voucherCode));
    
    // Calculate validity dates
    $validFrom = date('Y-m-d');
    $validUntil = date('Y-m-d', strtotime('+3 years'));
    
    $sql = "INSERT INTO vouchers (
        voucher_code, voucher_type, amount, title, description,
        buyer_name, buyer_email, recipient_name, personal_message,
        delivery_type, valid_from, valid_until, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        $voucherCode,
        $data['voucher_type'],
        $data['amount'],
        $data['title'],
        $data['description'] ?? '',
        $data['buyer_name'],
        $data['buyer_email'],
        $data['recipient_name'] ?? $data['buyer_name'],
        $data['personal_message'] ?? '',
        $data['delivery_type'] ?? 'email',
        $validFrom,
        $validUntil
    ]);
    
    if ($success) {
        return [
            'voucher_id' => $pdo->lastInsertId(),
            'voucher_code' => $voucherCode,
            'valid_until' => $validUntil
        ];
    }
    
    return false;
}

/**
 * Get voucher types and configurations
 */
function getVoucherTypes() {
    return [
        'amount' => [
            '25' => [
                'title' => 'Starter-Gutschein',
                'description' => 'Perfekt für den ersten Besuch',
                'amount' => 25.00
            ],
            '50' => [
                'title' => 'Standard-Gutschein',
                'description' => 'Ideal für ein komplettes Erlebnis',
                'amount' => 50.00
            ],
            '75' => [
                'title' => 'Premium-Gutschein',
                'description' => 'Für besondere Anlässe',
                'amount' => 75.00
            ],
            '100' => [
                'title' => 'Luxus-Gutschein',
                'description' => 'Das ultimative Geschenk',
                'amount' => 100.00
            ]
        ],
        'experience' => [
            'date-night' => [
                'title' => 'Date-Night',
                'description' => 'Romantischer Abend für zwei',
                'amount' => 65.00
            ],
            'friends-day' => [
                'title' => 'Freundinnen-Tag',
                'description' => 'Unvergesslicher Tag mit der besten Freundin',
                'amount' => 85.00
            ],
            'family' => [
                'title' => 'Familien-Erlebnis',
                'description' => 'Kreative Familienzeit für 4 Personen',
                'amount' => 120.00
            ]
        ]
    ];
}

/**
 * Generate voucher PDF
 */
function generateVoucherPDF($voucherData) {
    // This would integrate with a PDF library like TCPDF or FPDF
    // For now, return a placeholder URL
    return "/vouchers/pdf/{$voucherData['voucher_code']}.pdf";
}

/**
 * Send voucher email
 */
function sendVoucherEmail($voucherData, $pdfPath = null) {
    global $config;
    
    $subject = "Dein Layers Ceramics Studio Gutschein - {$voucherData['voucher_code']}";
    
    $emailBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #2C3E50; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B35; color: white; padding: 30px; text-align: center; }
            .voucher-card { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 40px; margin: 30px 0; border-radius: 15px; text-align: center; }
            .voucher-code { font-size: 24px; font-weight: bold; letter-spacing: 2px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; }
            .content { padding: 30px; background: white; }
            .footer { background: #F8F9FA; padding: 20px; text-align: center; font-size: 12px; }
            .highlight { color: #FF6B35; font-weight: bold; }
            .button { display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎁 Dein Gutschein ist da!</h1>
                <p>Vielen Dank für deinen Kauf bei Layers Ceramics Studio</p>
            </div>
            
            <div class='voucher-card'>
                <h2>{$voucherData['title']}</h2>
                <div class='voucher-code'>{$voucherData['voucher_code']}</div>
                <p><strong>Wert: {$voucherData['amount']}€</strong></p>
                <p>Gültig bis: " . date('d.m.Y', strtotime($voucherData['valid_until'])) . "</p>
            </div>
            
            <div class='content'>
                <h3>Liebe/r {$voucherData['buyer_name']},</h3>
                
                <p>dein Gutschein für Layers Ceramics Studio ist bereit! " . 
                (!empty($voucherData['recipient_name']) && $voucherData['recipient_name'] !== $voucherData['buyer_name'] ? 
                "Du kannst ihn jetzt an <strong>{$voucherData['recipient_name']}</strong> weitergeben." : 
                "Du kannst ihn ab sofort einlösen.") . "</p>";
                
    if (!empty($voucherData['personal_message'])) {
        $emailBody .= "<div style='background: #F8F9FA; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0;'>
            <h4>Deine persönliche Nachricht:</h4>
            <p><em>" . nl2br(htmlspecialchars($voucherData['personal_message'])) . "</em></p>
        </div>";
    }
    
    $emailBody .= "
                <h4>So löst du den Gutschein ein:</h4>
                <ol>
                    <li>Besuche unser Studio oder buche online einen Termin</li>
                    <li>Gib bei der Buchung oder vor Ort deinen Gutscheincode an</li>
                    <li>Wähle deine Lieblingskeramik und leg los!</li>
                    <li>Nach einer Woche ist dein Kunstwerk fertig gebrannt</li>
                </ol>
                
                <p><strong>Wichtige Informationen:</strong></p>
                <ul>
                    <li>Gutschein gültig bis " . date('d.m.Y', strtotime($voucherData['valid_until'])) . "</li>
                    <li>Einlösbar im Studio oder nach Voranmeldung</li>
                    <li>Nicht mit anderen Aktionen kombinierbar</li>
                    <li>Restguthaben bleibt erhalten</li>
                </ul>
                
                <div style='text-align: center;'>
                    <a href='tel:+4922112345678' class='button'>Termin buchen: 0221 123 456 78</a>
                </div>
                
                <p>Wir freuen uns darauf, gemeinsam mit " . 
                (!empty($voucherData['recipient_name']) && $voucherData['recipient_name'] !== $voucherData['buyer_name'] ? 
                $voucherData['recipient_name'] : "dir") . " 
                wunderschöne Keramik zu gestalten!</p>
                
                <p>Liebe Grüße<br>Dein Layers Team</p>
            </div>
            
            <div class='footer'>
                <p><strong>Layers Ceramics Studio</strong><br>
                Musterstraße 123, 50667 Köln<br>
                Tel: 0221 123 456 78 | E-Mail: info@layers-koeln.de<br>
                <a href='https://layers-koeln.de'>www.layers-koeln.de</a></p>
            </div>
        </div>
    </body>
    </html>";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: ' . $config['email']['from'],
        'Reply-To: ' . $config['email']['studio']
    ];
    
    $success = mail($voucherData['buyer_email'], $subject, $emailBody, implode("\r\n", $headers));
    
    // Also send notification to studio
    $studioSubject = "[Layers] Neuer Gutschein verkauft - {$voucherData['voucher_code']}";
    $studioBody = "
    <h2>Neuer Gutschein verkauft</h2>
    <p><strong>Code:</strong> {$voucherData['voucher_code']}</p>
    <p><strong>Wert:</strong> {$voucherData['amount']}€</p>
    <p><strong>Käufer:</strong> {$voucherData['buyer_name']} ({$voucherData['buyer_email']})</p>
    <p><strong>Empfänger:</strong> {$voucherData['recipient_name']}</p>
    <p><strong>Gültig bis:</strong> " . date('d.m.Y', strtotime($voucherData['valid_until'])) . "</p>";
    
    mail($config['email']['studio'], $studioSubject, $studioBody, implode("\r\n", $headers));
    
    return $success;
}

/**
 * Process PayPal payment
 */
function processPayPalPayment($amount, $voucherId) {
    global $config;
    
    // PayPal API integration would go here
    // For now, return success for testing
    return [
        'success' => true,
        'payment_id' => 'PAYPAL_' . uniqid(),
        'status' => 'completed'
    ];
}

/**
 * Validate voucher purchase data
 */
function validateVoucherData($data) {
    $errors = [];
    
    if (empty($data['voucher_type'])) {
        $errors[] = 'Gutschein-Typ ist erforderlich';
    }
    
    if (empty($data['buyer_name'])) {
        $errors[] = 'Name ist erforderlich';
    }
    
    if (empty($data['buyer_email']) || !filter_var($data['buyer_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Gültige E-Mail-Adresse ist erforderlich';
    }
    
    if (empty($data['amount']) || !is_numeric($data['amount']) || $data['amount'] < 15) {
        $errors[] = 'Gültiger Betrag (min. 15€) ist erforderlich';
    }
    
    return $errors;
}

// Main request handling
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            switch ($path) {
                case 'types':
                    // Return available voucher types
                    echo json_encode([
                        'success' => true,
                        'data' => getVoucherTypes()
                    ]);
                    break;
                    
                case 'verify':
                    // Verify voucher code
                    $code = $_GET['code'] ?? '';
                    if (empty($code)) {
                        throw new Exception('Gutscheincode erforderlich');
                    }
                    
                    $pdo = getDatabase();
                    $stmt = $pdo->prepare("SELECT * FROM vouchers WHERE voucher_code = ? AND status IN ('paid', 'sent') AND valid_until >= CURDATE()");
                    $stmt->execute([$code]);
                    $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$voucher) {
                        throw new Exception('Gutschein nicht gefunden oder ungültig');
                    }
                    
                    $remainingAmount = $voucher['amount'] - $voucher['redeemed_amount'];
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'code' => $voucher['voucher_code'],
                            'title' => $voucher['title'],
                            'amount' => $voucher['amount'],
                            'redeemed_amount' => $voucher['redeemed_amount'],
                            'remaining_amount' => $remainingAmount,
                            'valid_until' => $voucher['valid_until'],
                            'recipient_name' => $voucher['recipient_name']
                        ]
                    ]);
                    break;
                    
                default:
                    throw new Exception('Unbekannte Aktion');
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Ungültige Eingabedaten');
            }
            
            switch ($path) {
                case 'purchase':
                    // Validate input
                    $errors = validateVoucherData($input);
                    if (!empty($errors)) {
                        throw new Exception(implode(', ', $errors));
                    }
                    
                    // Get voucher configuration
                    $voucherTypes = getVoucherTypes();
                    $voucherConfig = null;
                    
                    foreach ($voucherTypes as $category => $types) {
                        if (isset($types[$input['voucher_type']])) {
                            $voucherConfig = $types[$input['voucher_type']];
                            $voucherConfig['voucher_type'] = $category;
                            break;
                        }
                    }
                    
                    if (!$voucherConfig && $input['voucher_type'] !== 'custom') {
                        throw new Exception('Ungültiger Gutschein-Typ');
                    }
                    
                    // Prepare voucher data
                    $voucherData = [
                        'voucher_type' => $voucherConfig['voucher_type'] ?? 'amount',
                        'amount' => $input['amount'],
                        'title' => $voucherConfig['title'] ?? 'Individueller Gutschein',
                        'description' => $voucherConfig['description'] ?? '',
                        'buyer_name' => $input['buyer_name'],
                        'buyer_email' => $input['buyer_email'],
                        'recipient_name' => $input['recipient_name'] ?? $input['buyer_name'],
                        'personal_message' => $input['personal_message'] ?? '',
                        'delivery_type' => $input['delivery_type'] ?? 'email'
                    ];
                    
                    // Create voucher
                    $result = createVoucher($voucherData);
                    if (!$result) {
                        throw new Exception('Gutschein konnte nicht erstellt werden');
                    }
                    
                    // Add voucher details to data
                    $voucherData = array_merge($voucherData, $result);
                    
                    // Process payment (simplified for demo)
                    $paymentResult = processPayPalPayment($voucherData['amount'], $result['voucher_id']);
                    
                    if ($paymentResult['success']) {
                        // Update voucher status
                        $pdo = getDatabase();
                        $stmt = $pdo->prepare("UPDATE vouchers SET status = 'paid', payment_id = ?, payment_status = 'completed' WHERE id = ?");
                        $stmt->execute([$paymentResult['payment_id'], $result['voucher_id']]);
                        
                        // Send voucher email
                        $emailSent = sendVoucherEmail($voucherData);
                        
                        if ($emailSent) {
                            $stmt = $pdo->prepare("UPDATE vouchers SET status = 'sent' WHERE id = ?");
                            $stmt->execute([$result['voucher_id']]);
                        }
                        
                        echo json_encode([
                            'success' => true,
                            'message' => 'Gutschein erfolgreich gekauft und versendet!',
                            'data' => [
                                'voucher_code' => $result['voucher_code'],
                                'payment_id' => $paymentResult['payment_id'],
                                'email_sent' => $emailSent
                            ]
                        ]);
                    } else {
                        throw new Exception('Zahlung fehlgeschlagen');
                    }
                    break;
                    
                default:
                    throw new Exception('Unbekannte Aktion');
            }
            break;
            
        default:
            throw new Exception('Methode nicht erlaubt');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    
    error_log("Voucher handler error: " . $e->getMessage());
}
?>
