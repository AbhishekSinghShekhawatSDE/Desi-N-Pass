/**
 * Main JavaScript for Desi N Pass Website
 * 
 * This script handles:
 * 1. Configuration for API keys and product details.
 * 2. Animate-on-scroll functionality for sections.
 * 3. 3D tilt effect for the product showcase image.
 * 4. E-commerce Product Detail Page (PDP) logic, including an image carousel.
 * 5. Modal controls for the purchase form and success message.
 * 6. Payment integration with Razorpay, including a security token.
 * 7. Form submission to a Google Apps Script backend.
 * 8. Minor dynamic updates like footer year.
 */

// --- 1. CONFIGURATION ---
const CONFIG = {
    // IMPORTANT: REPLACE WITH YOUR LIVE RAZORPAY KEY
    RAZORPAY_KEY_ID: "rzp_live_xxxxxxxxxxxxxx", 
    // IMPORTANT: REPLACE WITH YOUR GOOGLE APPS SCRIPT URL
    SCRIPT_URL: "https://script.google.com/macros/s/your_unique_url/exec",
    // IMPORTANT: This key MUST match the one you use for verification
    SECRET_KEY: "o9D8U*yrfd@Krryna7brBDeEROfWpB!%", 
    PRODUCT_NAME: "Desi N Pass",
    PRODUCT_DESCRIPTION: "Official Digital Verifiable Pass",
    CURRENCY: "INR",
    AMOUNT_IN_PAISE: 9900, // For ₹99.00
};

// --- 2. INITIALIZATION ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    Object.freeze(CONFIG); 
    initAnimateOnScroll();
    init3DTiltEffect();
    initProductCarousel();
    initModalControls();
    initPaymentForm();
    updateFooterYear();
});

// --- 3. UI & ANIMATION FUNCTIONS ---
function initAnimateOnScroll() { /* ... function is unchanged ... */ }
function init3DTiltEffect() { /* ... function is unchanged ... */ }
function initProductCarousel() { /* ... function is unchanged ... */ }

/**
 * Sets up event listeners for opening and closing all modals.
 */
function initModalControls() {
    const formModal = document.getElementById('form-modal');
    const successModal = document.getElementById('success-modal');
    const openFormBtn = document.getElementById('open-form-modal-btn');
    const closeBtns = document.querySelectorAll('.modal-close-btn');
    const overlays = document.querySelectorAll('.modal-overlay');

    const openModal = (modal) => { if (modal) modal.classList.remove('hidden'); }
    const closeModal = (modal) => { if (modal) modal.classList.add('hidden'); }

    if (openFormBtn) openFormBtn.addEventListener('click', () => openModal(formModal));
    
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        closeModal(formModal);
        closeModal(successModal);
    }));
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { closeModal(overlay); }
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") { closeModal(formModal); closeModal(successModal); }
    });
}

// --- 4. PAYMENT & BACKEND LOGIC ---

/**
 * Initializes the payment form, handling validation, security token generation, and Razorpay integration.
 */
function initPaymentForm() {
    const orderForm = document.getElementById('order-form');
    const formModal = document.getElementById('form-modal');
    const body = document.body;

    if (!orderForm || !formModal) return;

    orderForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        if (nameInput.value.trim() === "" || emailInput.value.trim() === "") {
            alert("Bhai, naam aur email toh daal de.");
            return;
        }

        const orderDataString = emailInput.value.toLowerCase() + '|' + new Date().getTime();
        const hashedToken = CryptoJS.HmacSHA256(orderDataString, CONFIG.SECRET_KEY).toString();

        const razorpayOptions = {
            key: CONFIG.RAZORPAY_KEY_ID,
            amount: CONFIG.AMOUNT_IN_PAISE,
            currency: CONFIG.CURRENCY,
            name: CONFIG.PRODUCT_NAME,
            description: CONFIG.PRODUCT_DESCRIPTION,
            image: "assets/logo.png",
            prefill: {
                name: nameInput.value,
                email: emailInput.value
            },
            notes: {
                "verification_token": hashedToken
            },
            theme: { color: "#007AFF" },
            handler: function (response) {
                body.classList.remove('razorpay-active');
                const formData = {
                    name: nameInput.value,
                    email: emailInput.value,
                    paymentId: response.razorpay_payment_id,
                    verificationToken: orderDataString
                };
                handleSuccessfulPayment(formData);
            },
            modal: {
                ondismiss: function () {
                    console.log('Payment modal was closed by user.');
                    body.classList.remove('razorpay-active');
                }
            }
        };
        
        const rzp = new Razorpay(razorpayOptions);
        
        // Hide your own modal and apply the background lock class
        closeModal(formModal);
        body.classList.add('razorpay-active');
        
        rzp.open();
    });
}

/**
 * Handles the logic after a successful payment.
 */
function handleSuccessfulPayment(formData) {
    const successModal = document.getElementById('success-modal');
    
    submitToGoogleScript(formData)
        .then(() => {
            openModal(successModal);
            setTimeout(() => { location.reload(); }, 5000);
        })
        .catch(error => {
            console.error("Submission failed, not showing success modal.", error);
        });
}

/**
 * Submits the form data to the Google Apps Script backend.
 */
function submitToGoogleScript(data) {
    return fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => {
        console.log('Successfully submitted to Google Script.');
    })
    .catch(error => {
        console.error('Error submitting to Google Script!', error.message);
        alert("Oops! Order submission failed. Please contact support with your payment ID.");
        throw error;
    });
}

// --- 5. DYNAMIC CONTENT ---
function updateFooterYear() {
    const yearSpan = document.getElementById('footer-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// Re-pasted unchanged functions for completeness
function initAnimateOnScroll() {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));
}
function init3DTiltEffect() {
    const imageFrame = document.querySelector('.showcase-image-frame');
    const showcaseImage = document.getElementById('showcase-image');
    if (!imageFrame || !showcaseImage) return;
    imageFrame.addEventListener('mousemove', (e) => {
        const rect = imageFrame.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        showcaseImage.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    imageFrame.addEventListener('mouseleave', () => {
        showcaseImage.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale(1)';
    });
}
// --- SMOOTH SCROLL FOR NAV LINKS ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
function initProductCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const navThumbs = document.querySelectorAll('.nav-thumb');
    if (navThumbs.length === 0 || slides.length === 0) return;
    navThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const targetSlideIndex = thumb.dataset.slide;
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index == targetSlideIndex);
            });
            navThumbs.forEach((t, index) => {
                t.classList.toggle('active', index == targetSlideIndex);
            });
        });
    });
}