-- Layers Ceramics Studio Database Schema
-- MySQL/MariaDB Schema for contact forms, bookings, and vouchers

-- Create database
CREATE DATABASE IF NOT EXISTS layers_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE layers_studio;

-- Contacts and Bookings Table
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('contact', 'booking', 'voucher') NOT NULL DEFAULT 'contact',
    
    -- Basic contact info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT,
    
    -- Booking-specific fields
    booking_type ENUM('walk-in', 'group', 'team', 'birthday', 'jga', 'family', 'company', 'school') NULL,
    booking_date DATE NULL,
    booking_time TIME NULL,
    booking_persons INT NULL,
    
    -- Group booking fields
    group_type VARCHAR(50) NULL,
    group_date DATE NULL,
    group_persons INT NULL,
    group_message TEXT NULL,
    
    -- Status and tracking
    status ENUM('new', 'contacted', 'confirmed', 'completed', 'cancelled') DEFAULT 'new',
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    INDEX idx_email (email),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB;

-- Vouchers Table
CREATE TABLE vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Voucher details
    voucher_code VARCHAR(20) UNIQUE NOT NULL,
    voucher_type ENUM('amount', 'experience') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Buyer information
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    
    -- Recipient information
    recipient_name VARCHAR(100),
    personal_message TEXT,
    
    -- Delivery and status
    delivery_type ENUM('email', 'pickup') NOT NULL DEFAULT 'email',
    status ENUM('pending', 'paid', 'sent', 'redeemed', 'expired', 'cancelled') DEFAULT 'pending',
    
    -- Financial
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    redeemed_at TIMESTAMP NULL,
    redeemed_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_voucher_code (voucher_code),
    INDEX idx_buyer_email (buyer_email),
    INDEX idx_status (status),
    INDEX idx_valid_until (valid_until),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Studio Settings Table (for CMS-like functionality)
CREATE TABLE studio_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'number', 'boolean', 'json') DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB;

-- Opening Hours Table
CREATE TABLE opening_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week TINYINT NOT NULL, -- 0=Sunday, 1=Monday, etc.
    is_open BOOLEAN DEFAULT TRUE,
    open_time TIME,
    close_time TIME,
    notes VARCHAR(255),
    
    UNIQUE KEY unique_day (day_of_week)
) ENGINE=InnoDB;

-- Special Dates Table (holidays, special events, closures)
CREATE TABLE special_dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    type ENUM('closed', 'special_hours', 'event', 'holiday') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    open_time TIME NULL,
    close_time TIME NULL,
    is_bookable BOOLEAN DEFAULT FALSE,
    
    INDEX idx_date (date),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- FAQ Table (for easy content management)
CREATE TABLE faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB;

-- Testimonials Table
CREATE TABLE testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    event_type VARCHAR(50),
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_approved (is_approved),
    INDEX idx_featured (is_featured),
    INDEX idx_rating (rating)
) ENGINE=InnoDB;

-- Admin Users Table (simple authentication)
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Insert default data

-- Default studio settings
INSERT INTO studio_settings (setting_key, setting_value, setting_type, description) VALUES
('studio_name', 'Layers Ceramics Studio', 'text', 'Name des Studios'),
('studio_address', 'Musterstraße 123, 50667 Köln', 'text', 'Vollständige Adresse'),
('studio_phone', '0221 123 456 78', 'text', 'Telefonnummer'),
('studio_email', 'info@layers-koeln.de', 'text', 'Haupt-E-Mail-Adresse'),
('max_walkin_persons', '8', 'number', 'Maximale Personen für Walk-in Buchungen'),
('min_group_persons', '4', 'number', 'Mindestpersonen für Gruppenbuchungen'),
('max_group_persons', '30', 'number', 'Maximale Personen für Gruppenbuchungen'),
('advance_booking_days', '14', 'number', 'Wie viele Tage im Voraus kann gebucht werden'),
('studio_fee_walkin', '7.00', 'number', 'Studiogebühr für Walk-in (Euro)'),
('studio_fee_group', '5.00', 'number', 'Studiogebühr für Gruppen pro Person (Euro)'),
('voucher_validity_years', '3', 'number', 'Gültigkeit von Gutscheinen in Jahren'),
('auto_confirm_walkin', 'true', 'boolean', 'Walk-in Buchungen automatisch bestätigen'),
('notification_email', 'info@layers-koeln.de', 'text', 'E-Mail für Benachrichtigungen'),
('booking_enabled', 'true', 'boolean', 'Online-Buchung aktiviert'),
('maintenance_mode', 'false', 'boolean', 'Wartungsmodus aktiviert');

-- Default opening hours (Tuesday to Sunday)
INSERT INTO opening_hours (day_of_week, is_open, open_time, close_time, notes) VALUES
(0, TRUE, '11:00:00', '18:00:00', 'Sonntag'), -- Sunday
(1, FALSE, NULL, NULL, 'Montag - Geschlossen'), -- Monday - Closed
(2, TRUE, '10:00:00', '19:00:00', 'Dienstag'), -- Tuesday
(3, TRUE, '10:00:00', '19:00:00', 'Mittwoch'), -- Wednesday
(4, TRUE, '10:00:00', '19:00:00', 'Donnerstag'), -- Thursday
(5, TRUE, '10:00:00', '19:00:00', 'Freitag'), -- Friday
(6, TRUE, '11:00:00', '18:00:00', 'Samstag'); -- Saturday

-- Sample FAQ entries
INSERT INTO faqs (category, question, answer, sort_order, is_active) VALUES
('booking', 'Muss ich vorab einen Termin buchen?', 'Für das offene Atelier ist keine Voranmeldung nötig. Wir empfehlen jedoch eine Reservierung, besonders am Wochenende. Für Gruppen ab 4 Personen ist eine Buchung erforderlich.', 1, TRUE),
('process', 'Wie lange dauert der Brennvorgang?', 'Deine Keramik ist nach etwa einer Woche fertig gebrannt und kann abgeholt werden. Wir informieren dich per E-Mail oder SMS, sobald sie bereit ist.', 2, TRUE),
('children', 'Können Kinder bei euch malen?', 'Ja! Kinder ab 4 Jahren sind herzlich willkommen. Wir haben spezielle kinderfreundliche Farben und Werkzeuge. Kinder unter 12 Jahren sollten von einem Erwachsenen begleitet werden.', 3, TRUE),
('pricing', 'Was kostet das Keramikbemalen?', 'Die Preise variieren je nach Keramikstück (ab 8€) plus Studiogebühr (7€ pro Person). Alle Farben, Pinsel und der Brennvorgang sind inklusive.', 4, TRUE),
('parking', 'Gibt es Parkplätze?', 'Direkt vor dem Studio gibt es begrenzte Parkmöglichkeiten. Das Parkhaus Domkloster ist nur 5 Gehminuten entfernt und bietet ausreichend Plätze.', 5, TRUE),
('food', 'Kann ich Essen und Trinken mitbringen?', 'Getränke bieten wir im Studio an. Eigenes Essen darfst du gerne mitbringen, besonders bei längeren Aufenthalten oder Kindergeburtstagen.', 6, TRUE);

-- Sample testimonials
INSERT INTO testimonials (customer_name, rating, review_text, event_type, is_approved, is_featured) VALUES
('Sarah M.', 5, 'Wunderschönes Studio mit super freundlichem Personal. Perfekt für einen entspannten Nachmittag mit Freunden!', 'walk-in', TRUE, TRUE),
('Michael K.', 5, 'Unser Teamevent war ein voller Erfolg! Tolle Atmosphäre und professionelle Betreuung. Sehr empfehlenswert!', 'team-building', TRUE, TRUE),
('Anna L.', 5, 'Die Keramik@Home Option ist genial! Kann in Ruhe zu Hause gestalten und bekomme trotzdem professionelle Ergebnisse.', 'keramik-home', TRUE, FALSE),
('Lisa B.', 5, 'Mein JGA bei Layers war unvergesslich! Kreativ, entspannt und mit so viel Liebe zum Detail organisiert.', 'jga', TRUE, TRUE),
('Familie Weber', 4, 'Toller Familienausflug! Die Kinder waren begeistert und wir haben wunderschöne Erinnerungen geschaffen.', 'family', TRUE, FALSE);

-- Create admin user (password: admin123 - change in production!)
INSERT INTO admin_users (username, email, password_hash, role) VALUES
('admin', 'admin@layers-koeln.de', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Add some sample special dates
INSERT INTO special_dates (date, type, title, description, is_bookable) VALUES
('2025-12-24', 'closed', 'Heiligabend', 'Studio geschlossen', FALSE),
('2025-12-25', 'closed', '1. Weihnachtstag', 'Studio geschlossen', FALSE),
('2025-12-26', 'closed', '2. Weihnachtstag', 'Studio geschlossen', FALSE),
('2025-12-31', 'special_hours', 'Silvester', 'Nur bis 16:00 Uhr geöffnet', TRUE),
('2025-01-01', 'closed', 'Neujahr', 'Studio geschlossen', FALSE);

-- Views for easier querying

-- Active bookings view
CREATE VIEW active_bookings AS
SELECT 
    id,
    name,
    email,
    phone,
    booking_type,
    booking_date,
    booking_time,
    booking_persons,
    group_type,
    group_date,
    group_persons,
    status,
    created_at
FROM contacts 
WHERE type = 'booking' 
AND status IN ('new', 'contacted', 'confirmed')
ORDER BY 
    COALESCE(booking_date, group_date) ASC,
    booking_time ASC;

-- Recent inquiries view
CREATE VIEW recent_inquiries AS
SELECT 
    id,
    type,
    name,
    email,
    subject,
    message,
    status,
    created_at
FROM contacts 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- Active vouchers view
CREATE VIEW active_vouchers AS
SELECT 
    voucher_code,
    title,
    amount,
    recipient_name,
    valid_until,
    redeemed_amount,
    (amount - redeemed_amount) AS remaining_amount,
    status
FROM vouchers 
WHERE status IN ('paid', 'sent') 
AND valid_until >= CURDATE()
ORDER BY valid_until ASC;

COMMIT;
