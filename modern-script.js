// Modern Layers Studio JavaScript

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
// (Already declared above, so this block is removed)

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
});

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
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
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
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
}

// Scroll Effects
function initializeScrollEffects() {
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Hide/show floating booking button based on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            // Scrolling down
            floatingBooking.style.transform = 'translateY(100px)';
        } else {
            // Scrolling up
            floatingBooking.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Animation Functions
function initializeAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
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
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
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
    
    // Clear existing steps
    const modalBody = document.querySelector('.booking-modal-body');
    
    if (type === 'walk-in') {
        showWalkInBooking(modalBody);
    } else if (type === 'group') {
        showGroupBooking(modalBody);
    }
}

function showWalkInBooking(container) {
    container.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🎨</div>
                <h4>Offenes Atelier buchen</h4>
                <p style="color: var(--text-secondary);">Wähle deinen Wunschtermin und komm spontan vorbei</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Datum wählen</label>
                <input type="date" id="booking-date" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;" min="${getTodayDate()}">
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Uhrzeit</label>
                <select id="booking-time" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Uhrzeit wählen</option>
                    <option value="10:00">10:00 Uhr</option>
                    <option value="12:00">12:00 Uhr</option>
                    <option value="14:00">14:00 Uhr</option>
                    <option value="16:00">16:00 Uhr</option>
                    <option value="18:00">18:00 Uhr</option>
                </select>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Anzahl Personen</label>
                <select id="booking-persons" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Personen wählen</option>
                    <option value="1">1 Person</option>
                    <option value="2">2 Personen</option>
                    <option value="3">3 Personen</option>
                    <option value="4">4 Personen</option>
                    <option value="5">5+ Personen</option>
                </select>
            </div>
            
            <div style="background: var(--background-light); padding: 16px; border-radius: var(--border-radius); margin-bottom: 24px;">
                <h5 style="margin-bottom: 8px;">Was ist inbegriffen:</h5>
                <ul style="list-style: none; font-size: 0.875rem; color: var(--text-secondary);">
                    <li style="margin-bottom: 4px;">✓ Keramikstück deiner Wahl</li>
                    <li style="margin-bottom: 4px;">✓ Alle Farben und Pinsel</li>
                    <li style="margin-bottom: 4px;">✓ Professioneller Brand</li>
                    <li style="margin-bottom: 4px;">✓ Getränke (Kaffee, Tee, Wasser)</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button onclick="closeBooking()" style="flex: 1; padding: 12px; background: transparent; border: 2px solid var(--border); border-radius: var(--border-radius); cursor: pointer;">Abbrechen</button>
                <button onclick="proceedToContactForm()" style="flex: 2; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Weiter</button>
            </div>
        </div>
    `;
}

function showGroupBooking(container) {
    container.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">👥</div>
                <h4>Gruppenevent planen</h4>
                <p style="color: var(--text-secondary);">Lass uns gemeinsam dein perfektes Event gestalten</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Art des Events</label>
                <select id="group-type" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                    <option value="">Event-Art wählen</option>
                    <option value="birthday">Geburtstag</option>
                    <option value="team">Teambuilding</option>
                    <option value="jga">Junggesellenabschied</option>
                    <option value="family">Familienfeier</option>
                    <option value="company">Firmenfeier</option>
                    <option value="other">Sonstiges</option>
                </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Wunschdatum</label>
                    <input type="date" id="group-date" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;" min="${getTodayDate()}">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Anzahl Personen</label>
                    <input type="number" id="group-persons" placeholder="z.B. 8" min="4" max="30" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
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
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">📧</div>
                <h4>Kontaktdaten</h4>
                <p style="color: var(--text-secondary);">Damit wir deine Buchung bestätigen können</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Vorname *</label>
                    <input type="text" id="contact-firstname" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nachname *</label>
                    <input type="text" id="contact-lastname" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">E-Mail *</label>
                <input type="email" id="contact-email" required style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Telefon (optional)</label>
                <input type="tel" id="contact-phone" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--border-radius); font-size: 16px;">
            </div>
            
            <div style="background: var(--background-light); padding: 16px; border-radius: var(--border-radius); margin-bottom: 24px; font-size: 0.875rem; color: var(--text-secondary);">
                <p><strong>Nächste Schritte:</strong></p>
                <p style="margin-top: 8px;">1. Wir bestätigen deine Anfrage per E-Mail<br>
                2. Bei Gruppenbuchungen melden wir uns telefonisch<br>
                3. Du erhältst alle Details und Zahlungsinformationen</p>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button onclick="closeBooking()" style="flex: 1; padding: 12px; background: transparent; border: 2px solid var(--border); border-radius: var(--border-radius); cursor: pointer;">Abbrechen</button>
                <button onclick="submitBooking()" style="flex: 2; padding: 12px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 500;">Buchung absenden</button>
            </div>
        </div>
    `;
}

function submitBooking() {
    // Collect form data
    const formData = collectBookingData();
    
    if (!validateBookingData(formData)) {
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('button[onclick="submitBooking()"]');
    const originalButtonText = showLoadingState(submitButton);
    
    // Send data to backend
    apiRequest(API_ENDPOINTS.voucher, formData)
        .then(response => {
            // Handle success
            showBookingSuccess();
            showNotification('Buchung erfolgreich! Du erhältst in Kürze eine Bestätigungs-E-Mail.', 'success');
        })
        .catch(error => {
            // Handle error
            console.error('Booking Error:', error);
            alert('Bei der Buchung ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
        })
        .finally(() => {
            // Reset button state
            hideLoadingState(submitButton);
        });
}

function collectBookingData() {
    const data = { ...bookingData };
    
    // Contact data
    data.firstName = document.getElementById('contact-firstname')?.value;
    data.lastName = document.getElementById('contact-lastname')?.value;
    data.email = document.getElementById('contact-email')?.value;
    data.phone = document.getElementById('contact-phone')?.value;
    
    // Booking specific data
    if (data.type === 'walk-in') {
        data.date = document.getElementById('booking-date')?.value;
        data.time = document.getElementById('booking-time')?.value;
        data.persons = document.getElementById('booking-persons')?.value;
    } else if (data.type === 'group') {
        data.groupType = document.getElementById('group-type')?.value;
        data.date = document.getElementById('group-date')?.value;
        data.persons = document.getElementById('group-persons')?.value;
        data.message = document.getElementById('group-message')?.value;
    }
    
    return data;
}

function validateBookingData(data) {
    if (!data.firstName || !data.lastName || !data.email) {
        alert('Bitte fülle alle Pflichtfelder aus.');
        return false;
    }
    
    if (!isValidEmail(data.email)) {
        alert('Bitte gib eine gültige E-Mail-Adresse ein.');
        return false;
    }
    
    return true;
}

function showBookingConfirmation() {
    const modalBody = document.querySelector('.booking-modal-body');
    
    modalBody.innerHTML = `
        <div class="booking-step active" style="text-align: center; padding: 40px 20px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 20px; border: 3px solid var(--primary); border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h4>Buchung wird übermittelt...</h4>
            <p style="color: var(--text-secondary); margin-top: 8px;">Einen Moment bitte</p>
        </div>
        
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
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

// Utility Functions
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Contact Form (for contact page)
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactSubmission();
        });
    }
}

function handleContactSubmission() {
    const formData = new FormData(document.getElementById('contact-form'));
    
    // Show loading state
    const submitButton = document.querySelector('#contact-form button[type="submit"]');
    const originalButtonText = showLoadingState(submitButton);
    
    // Send data to backend
    apiRequest(API_ENDPOINTS.contact, Object.fromEntries(formData))
        .then(response => {
            // Handle success
            showNotification('Nachricht gesendet! Wir melden uns bald bei dir.', 'success');
            document.getElementById('contact-form').reset();
        })
        .catch(error => {
            // Handle error
            console.error('Contact Form Error:', error);
            alert('Bei der Übermittlung ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
        })
        .finally(() => {
            // Reset button state
            hideLoadingState(submitButton);
        });
}

// Export functions for global use
window.openBooking = openBooking;
window.closeBooking = closeBooking;
window.selectBookingType = selectBookingType;
window.proceedToContactForm = proceedToContactForm;
window.submitBooking = submitBooking;
