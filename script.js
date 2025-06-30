/**
 * Main JavaScript for Desi N Pass Website
 * 
 * This script handles:
 * 1. Configuration for the backend API URL.
 * 2. Animate-on-scroll functionality for sections.
 * 3. 3D tilt effect for the product showcase image.
 * 4. E-commerce Product Detail Page (PDP) logic, including an image carousel.
 * 5. Purchase initiation logic that passes user data to a dedicated checkout page.
 * 6. Handling the success redirect from the checkout page to show a confirmation modal.
 * 7. Minor dynamic updates like footer year.
 */

// --- 1. CONFIGURATION ---
const CONFIG = {
    // IMPORTANT: REPLACE WITH YOUR GOOGLE APPS SCRIPT URL
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzqBEXkosCcCfAanSBabKqbrM1yOEnctz8N-x6Bg4Q54JSzY9nQGVKHijjQ8VGHS4vm/exec",
};

// --- 2. INITIALIZATION ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    Object.freeze(CONFIG); 
    initAnimateOnScroll();
    init3DTiltEffect();
    initProductCarousel();
    // Replaced initModalControls and initPaymentForm with the new, simpler flow
    initPurchaseFlow(); 
    handleSuccessRedirect();
    updateFooterYear();
});

// --- 3. UI & ANIMATION FUNCTIONS (Unchanged from your version) ---

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


// --- 4. NEW PURCHASE & REDIRECT LOGIC ---

/**
 * Handles the form submission by saving data to sessionStorage and redirecting
 * to the dedicated checkout page. This replaces the old modal logic.
 */
function initPurchaseFlow() {
    const checkoutForm = document.getElementById('order-form');
    // We now link directly from the #buy section button, so we target that.
    const buyButton = document.getElementById('open-checkout-btn'); 

    if (!buyButton || !checkoutForm) return;

    // The button is now a link, but we can still add JS logic if needed.
    // For now, the direct link in the HTML is sufficient.
    
    // This part is for the form that is NOW on the checkout page, 
    // but we can pre-emptively write logic if we were to re-use this script.
    // For now, this function's main job is done by the <a> tag in index.html.
    // The following code is effectively a placeholder for if you revert to a modal.
    checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const payButton = document.getElementById('pay-button');
        if (payButton) {
            payButton.disabled = true;
            payButton.textContent = 'Redirecting...';
        }

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        // Simple email validation
        if (nameInput.value.trim() === "" || !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
            alert("Please enter a valid name and email.");
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = 'Proceed to Payment';
            }
            return;
        }

        // Save data to sessionStorage to pass to the next page
        sessionStorage.setItem('dnp_userName', nameInput.value.trim());
        sessionStorage.setItem('dnp_userEmail', emailInput.value.trim());

        // Redirect to the dedicated checkout page
        window.location.href = 'checkout.html';
    });
}


/**
 * On the index.html page load, this function checks if it's a redirect from a 
 * successful payment on checkout.html. If so, it shows the success modal
 * and sends the data to the backend.
 */
function handleSuccessRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
        // Find the success modal and show it.
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.classList.remove('hidden');
        }

        const formData = {
            name: urlParams.get('name'),
            email: urlParams.get('email'),
            paymentId: urlParams.get('paymentId'),
            verificationToken: urlParams.get('token')
        };

        // Submit to Google Script in the background
        submitToGoogleScript(formData)
            .then(() => {
                console.log("Order data successfully submitted to backend after redirect.");
                // Clean the URL to remove parameters, so a refresh doesn't re-submit
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // The success modal correctly says it will reload. Let's make that happen.
                setTimeout(() => {
                   window.location.href = 'index.html'; // Redirect to clean page
                }, 5000);
            })
            .catch(error => {
                // If submission fails, alert the user but acknowledge their payment was successful
                alert("Your payment was successful, but there was an error saving your order. Please contact support with your Payment ID!");
                console.error("Submission failed on redirect.", error);
            });
    }
}

/**
 * Submits the form data to the Google Apps Script backend.
 */
function submitToGoogleScript(data) {
    return fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) { throw new Error(`Network response was not ok`); }
        return response.json();
    })
    .then(result => {
        console.log('Success response from Google Script:', result);
    })
    .catch(error => {
        console.error('Error submitting to Google Script!', error.message);
        // We throw the error so the calling function can handle it
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