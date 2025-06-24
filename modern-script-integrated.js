// Modern Layers Studio JavaScript with Backend Integration

// Global variables
let currentBookingStep = 1;
let bookingData = {};

// API Configuration
const API_BASE_URL = 'backend/';
const API_ENDPOINTS = {
    contact: API_BASE_URL + 'contact-handler.php',
    voucher: API_BASE_URL + 'voucher-handler.php'
};

// DOM Elements
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const bookingModal = document.getElementById('booking-modal');
const floatingBooking = document.getElementById('floating-booking');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeAnimations();
    initializeBookingSystem();
    initializeContactForm();
    initializeVoucherForm();
});

// API Helper Functions
async function apiRequest(endpoint, data, method = 'POST') {
    try {
        const formData = new FormData();
        
        // Add data to FormData
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        const response = await fetch(endpoint, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API-Fehler aufgetreten');
        }
        
        return result;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

function showLoadingState(button, originalText = null) {
    if (!originalText) {
        originalText = button.textContent;
    }
    button.setAttribute('data-original-text', originalText);
    button.textContent = 'Wird gesendet...';
    button.disabled = true;
    button.style.opacity = '0.7';
    return originalText;
}

function hideLoadingState(button) {
    const originalText = button.getAttribute('data-original-text') || 'Senden';
    button.textContent = originalText;
    button.disabled = false;
    button.style.opacity = '1';
    button.removeAttribute('data-original-text');
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            font-weight: 500;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Navigation Functions
function initializeNavigation() {
    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (hamburger && navMenu && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (navMenu) {
                    navMenu.classList.remove('active');
                    if (hamburger) {
                        hamburger.classList.remove('active');
                    }
                }
            }
        });
    });
}

// Scroll Effects
function initializeScrollEffects() {
    // Header background on scroll
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Floating booking button visibility
    if (floatingBooking) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                floatingBooking.classList.add('visible');
            } else {
                floatingBooking.classList.remove('visible');
            }
        });
    }
}

// Animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .offer-card, .testimonial-card, .quick-action-card').forEach(el => {
        observer.observe(el);
    });
}

// Booking System Functions
function initializeBookingSystem() {
    // Close modal when clicking outside
    if (bookingModal) {
        bookingModal.addEventListener('click', function(e) {
            if (e.target === bookingModal) {
                closeBooking();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal && bookingModal.classList.contains('active')) {
            closeBooking();
        }
    });
}

function openBooking(type = null) {
    if (bookingModal) {
        bookingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (type) {
            selectBookingType(type);
        }
    }
}

function closeBooking() {
    if (bookingModal) {
        bookingModal.classList.remove('active');
        document.body.style.overflow = '';
        resetBookingSteps();
    }
}

function selectBookingType(type) {
    bookingData.type = type;
    
    const modalBody = document.querySelector('.booking-modal-body');
    if (!modalBody) return;
    
    if (type === 'individual') {
        showIndividualBooking();
    } else if (type === 'group') {
        showGroupBooking();
    }
}

function showIndividualBooking() {
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🎨</div>
                <h4>Einzeltermin buchen</h4>
                <p style="color: var(--text-secondary);">Wähle deinen Wunschtermin</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Datum *</label>
                <input type="date" id="individual-date" min="${getTodayDate()}" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Uhrzeit *</label>
                <select id="individual-time" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Bitte wählen...</option>
                    <option value="10:00">10:00 Uhr</option>
                    <option value="12:00">12:00 Uhr</option>
                    <option value="14:00">14:00 Uhr</option>
                    <option value="16:00">16:00 Uhr</option>
                    <option value="18:00">18:00 Uhr</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Teilnehmer *</label>
                <select id="individual-participants" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Anzahl wählen...</option>
                    <option value="1">1 Person (25€)</option>
                    <option value="2">2 Personen (45€)</option>
                    <option value="3">3 Personen (65€)</option>
                    <option value="4">4 Personen (80€)</option>
                </select>
            </div>
            
            <div style="background: var(--background-light); padding: 16px; border-radius: var(--border-radius); margin-bottom: 24px;">
                <h5 style="margin-bottom: 8px;">Im Preis enthalten:</h5>
                <ul style="list-style: none; font-size: 0.875rem; color: var(--text-secondary);">
                    <li style="margin-bottom: 4px;">✓ 2 Stunden Studiozeit</li>
                    <li style="margin-bottom: 4px;">✓ Alle Materialien & Werkzeuge</li>
                    <li style="margin-bottom: 4px;">✓ Brennen & Glasieren</li>
                    <li style="margin-bottom: 4px;">✓ Persönliche Anleitung</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button onclick="closeBooking()" style="flex: 1; padding: 12px; background: transparent; border: 2px solid var(--border); border-radius: var(--border-radius); cursor: pointer;">Abbrechen</button>
                <button onclick="proceedToContactForm()" style="flex: 2; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Weiter</button>
            </div>
        </div>
    `;
}

function showGroupBooking() {
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">👥</div>
                <h4>Gruppenevent anfragen</h4>
                <p style="color: var(--text-secondary);">Für 5+ Personen - individuelle Beratung</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Wunschdatum</label>
                    <input type="date" id="group-date" min="${getTodayDate()}" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Teilnehmeranzahl *</label>
                    <input type="number" id="group-participants" min="5" max="25" required placeholder="z.B. 8" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Art des Events</label>
                <select id="group-type" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Bitte wählen...</option>
                    <option value="geburtstag">Geburtstag</option>
                    <option value="jga">Junggesellenabschied</option>
                    <option value="teambuilding">Teambuilding</option>
                    <option value="familie">Familienfeier</option>
                    <option value="sonstige">Sonstiges</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nachricht (optional)</label>
                <textarea id="group-message" placeholder="Besondere Wünsche, Fragen oder Anmerkungen..." style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px; min-height: 80px; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <div style="background: var(--background-light); padding: 16px; border-radius: var(--border-radius); margin-bottom: 24px;">
                <h5 style="margin-bottom: 8px;">Deine Vorteile:</h5>
                <ul style="list-style: none; font-size: 0.875rem; color: var(--text-secondary);">
                    <li style="margin-bottom: 4px;">✓ Exklusive Studionutzung</li>
                    <li style="margin-bottom: 4px;">✓ Persönliche Betreuung</li>
                    <li style="margin-bottom: 4px;">✓ Flexible Termine</li>
                    <li style="margin-bottom: 4px;">✓ Catering-Service möglich</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button onclick="closeBooking()" style="flex: 1; padding: 12px; background: transparent; border: 2px solid var(--border); border-radius: var(--border-radius); cursor: pointer;">Abbrechen</button>
                <button onclick="proceedToContactForm()" style="flex: 2; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Anfrage senden</button>
            </div>
        </div>
    `;
}

function proceedToContactForm() {
    // Collect booking data first
    if (bookingData.type === 'individual') {
        bookingData.date = document.getElementById('individual-date')?.value;
        bookingData.time = document.getElementById('individual-time')?.value;
        bookingData.participants = document.getElementById('individual-participants')?.value;
        
        // Validation
        if (!bookingData.date || !bookingData.time || !bookingData.participants) {
            showNotification('Bitte fülle alle Pflichtfelder aus.', 'error');
            return;
        }
    } else if (bookingData.type === 'group') {
        bookingData.date = document.getElementById('group-date')?.value;
        bookingData.participants = document.getElementById('group-participants')?.value;
        bookingData.eventType = document.getElementById('group-type')?.value;
        bookingData.message = document.getElementById('group-message')?.value;
        
        // Validation
        if (!bookingData.participants || bookingData.participants < 5) {
            showNotification('Gruppenbuchungen sind ab 5 Personen möglich.', 'error');
            return;
        }
    }
    
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">📧</div>
                <h4>Kontaktdaten</h4>
                <p style="color: var(--text-secondary);">Damit wir deine Buchung bestätigen können</p>
            </div>
            
            <form id="booking-contact-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Vorname *</label>
                        <input type="text" id="contact-firstname" name="firstname" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nachname *</label>
                        <input type="text" id="contact-lastname" name="lastname" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">E-Mail *</label>
                    <input type="email" id="contact-email" name="email" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Telefon</label>
                    <input type="tel" id="contact-phone" name="phone" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: flex; align-items: center; font-size: 0.9rem; color: var(--text-secondary);">
                        <input type="checkbox" required style="margin-right: 8px;">
                        Ich stimme der <a href="#" style="color: var(--primary);">Datenschutzerklärung</a> zu *
                    </label>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button type="button" onclick="closeBooking()" style="flex: 1; padding: 12px; background: transparent; border: 2px solid var(--border); border-radius: var(--border-radius); cursor: pointer;">Abbrechen</button>
                    <button type="submit" id="submit-booking-btn" style="flex: 2; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Buchung senden</button>
                </div>
            </form>
        </div>
    `;
    
    // Add form submit handler
    const bookingForm = document.getElementById('booking-contact-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);
    }
}

async function handleBookingSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-booking-btn');
    showLoadingState(submitBtn);
    
    try {
        // Collect form data
        const formData = {
            type: 'booking',
            firstname: document.getElementById('contact-firstname').value,
            lastname: document.getElementById('contact-lastname').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            booking_type: bookingData.type,
            booking_date: bookingData.date || '',
            booking_time: bookingData.time || '',
            participants: bookingData.participants || '',
            event_type: bookingData.eventType || '',
            message: bookingData.message || ''
        };
        
        // Send to backend
        const result = await apiRequest(API_ENDPOINTS.contact, formData);
        
        // Show success
        showBookingSuccess();
        showNotification('Buchungsanfrage erfolgreich gesendet!');
        
    } catch (error) {
        hideLoadingState(submitBtn);
        showNotification(error.message, 'error');
    }
}

function showBookingSuccess() {
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active" style="text-align: center; padding: 40px 20px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">✓</div>
            <h4 style="color: #10B981; margin-bottom: 16px;">Buchung erfolgreich!</h4>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                Vielen Dank für deine Buchung! Du erhältst in Kürze eine Bestätigungs-E-Mail mit allen wichtigen Informationen.
            </p>
            <div style="background: var(--background-light); padding: 16px; border-radius: var(--border-radius); margin-bottom: 24px; text-align: left;">
                <h5 style="margin-bottom: 8px;">Nächste Schritte:</h5>
                <ul style="list-style: none; font-size: 0.875rem; color: var(--text-secondary);">
                    <li style="margin-bottom: 4px;">📧 Bestätigungs-E-Mail (innerhalb von 10 Min.)</li>
                    <li style="margin-bottom: 4px;">📞 Rückruf bei Gruppenbuchungen (binnen 24h)</li>
                    <li style="margin-bottom: 4px;">🎨 Freue dich auf dein kreatives Erlebnis!</li>
                </ul>
            </div>
            <button onclick="closeBooking()" style="width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Schließen</button>
        </div>
    `;
}

function resetBookingSteps() {
    currentBookingStep = 1;
    bookingData = {};
}

// Contact Form (for contact page)
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
}

async function handleContactSubmission(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoadingState(submitBtn);
    
    try {
        // Collect form data
        const formData = new FormData(e.target);
        const data = {
            type: 'contact',
            firstname: formData.get('firstname'),
            lastname: formData.get('lastname'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            subject: formData.get('subject') || 'Kontaktanfrage',
            message: formData.get('message')
        };
        
        // Send to backend
        const result = await apiRequest(API_ENDPOINTS.contact, data);
        
        // Show success
        showContactSuccess();
        showNotification('Nachricht erfolgreich gesendet!');
        
    } catch (error) {
        hideLoadingState(submitBtn);
        showNotification(error.message, 'error');
    }
}

function showContactSuccess() {
    const formContainer = document.querySelector('.contact-form-container');
    if (formContainer) {
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">✓</div>
                <h3 style="color: #10B981; margin-bottom: 16px;">Nachricht gesendet!</h3>
                <p style="color: var(--text-secondary);">Vielen Dank für deine Nachricht. Wir melden uns binnen 24 Stunden bei dir zurück.</p>
            </div>
        `;
    }
}

// Voucher Form (for voucher page)
function initializeVoucherForm() {
    const voucherForm = document.getElementById('voucher-form');
    
    if (voucherForm) {
        voucherForm.addEventListener('submit', handleVoucherSubmission);
    }
}

async function handleVoucherSubmission(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoadingState(submitBtn);
    
    try {
        // Collect form data
        const formData = new FormData(e.target);
        const data = {
            voucher_type: formData.get('voucher_type'),
            amount: formData.get('amount'),
            recipient_name: formData.get('recipient_name'),
            recipient_email: formData.get('recipient_email'),
            buyer_name: formData.get('buyer_name'),
            buyer_email: formData.get('buyer_email'),
            buyer_phone: formData.get('buyer_phone') || '',
            message: formData.get('message') || '',
            payment_method: formData.get('payment_method') || 'bank_transfer'
        };
        
        // Send to backend
        const result = await apiRequest(API_ENDPOINTS.voucher, data);
        
        // Show success
        showVoucherSuccess(result.voucher_code);
        showNotification('Gutschein erfolgreich bestellt!');
        
    } catch (error) {
        hideLoadingState(submitBtn);
        showNotification(error.message, 'error');
    }
}

function showVoucherSuccess(voucherCode) {
    const formContainer = document.querySelector('.voucher-form-container');
    if (formContainer) {
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🎁</div>
                <h3 style="color: #10B981; margin-bottom: 16px;">Gutschein bestellt!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    Dein Gutschein wurde erfolgreich erstellt.
                </p>
                ${voucherCode ? `
                    <div style="background: var(--background-light); padding: 20px; border-radius: var(--border-radius); margin-bottom: 20px;">
                        <h4>Gutschein-Code:</h4>
                        <div style="font-family: monospace; font-size: 1.2em; font-weight: bold; margin: 10px 0; padding: 10px; background: white; border: 2px dashed var(--primary); border-radius: 4px;">
                            ${voucherCode}
                        </div>
                    </div>
                ` : ''}
                <p style="color: var(--text-secondary); font-size: 0.9em;">
                    Du erhältst in Kürze eine E-Mail mit allen Details und dem Gutschein als PDF.
                </p>
            </div>
        `;
    }
}

// Utility Functions
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export functions for global use
window.openBooking = openBooking;
window.closeBooking = closeBooking;
window.selectBookingType = selectBookingType;
window.proceedToContactForm = proceedToContactForm;
