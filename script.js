// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// Image modal
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalClose = document.getElementById('modalClose');

// Open modal when clicking on screenshots
document.querySelectorAll('.screenshot-item').forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
            modalImg.src = img.src;
            modalImg.alt = img.alt;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

// Close modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
modalClose.addEventListener('click', closeModal);

// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// Contact form submit
const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        if (!name || !email || !message) {
            contactSuccess.textContent = 'Please complete all fields before sending.';
            contactSuccess.style.color = '#dc2626';
            contactSuccess.classList.add('show');
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(contactForm)).toString(),
            });

            if (response.ok) {
                showPopup('Thanks! Your message was sent successfully.', true);
                contactForm.reset();
                contactSuccess.classList.remove('show');
            } else {
                throw new Error('submit failed');
            }
        } catch {
            showPopup('Unable to send. Please email capbuugames@gmail.com instead.', false);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

const popupNotification = document.getElementById('popupNotification');
const popupMessage = document.getElementById('popupMessage');
let popupTimeout;

function showPopup(message, success) {
    if (!popupNotification || !popupMessage) return;
    popupMessage.textContent = message;
    popupNotification.classList.toggle('fail', !success);
    popupNotification.hidden = false;
    popupNotification.classList.add('active');

    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
        popupNotification.classList.remove('active');
        popupTimeout = setTimeout(() => {
            popupNotification.hidden = true;
        }, 250);
    }, 4200);
}

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.screenshot-item, .stat-item').forEach(el => {
    observer.observe(el);
});

// Parallax scroll effect — throttled with rAF to avoid layout thrashing
let rafPending = false;
window.addEventListener('scroll', () => {
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const heroImage = document.querySelector('.hero-image');
            if (heroImage && window.innerWidth > 900) {
                heroImage.style.transform = `translateY(${scrolled * 0.05}px)`;
            }
            rafPending = false;
        });
    }
});
