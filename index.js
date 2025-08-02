// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });



    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }

    // Button click handlers
    const buttons = document.querySelectorAll('.btn-primary, .btn-accent, .btn-outline');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Handle different button actions
            const buttonText = this.textContent.toLowerCase();
            
            if (buttonText.includes('download')) {
                // Simulate download action
                console.log('Download button clicked');
                // You can add actual download logic here
                alert('Download started! (This is a demo)');
            } else if (buttonText.includes('trial') || buttonText.includes('pro')) {
                // Simulate subscription action
                console.log('Subscription button clicked');
                alert('Redirecting to subscription page... (This is a demo)');
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .faq-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            hero.style.transform = `translateY(${rate}px)`;
        });
    }

    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle scroll events for better performance
const throttledScroll = debounce(function() {
    // Scroll event handling
}, 16);

window.addEventListener('scroll', throttledScroll);

// Modal functionality - make it globally available
window.showWaitlistModal = function() {
    console.log('showWaitlistModal called');
    const modal = document.getElementById('waitlistModal');
    console.log('Modal element:', modal);
    
    if (modal) {
        console.log('Showing modal...');
        
        // Блокируем скролл до показа модального окна
        document.body.classList.add('modal-open');
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modal.style.zIndex = '9999';
        modal.style.backdropFilter = 'blur(4px)';
        
        // Добавляем класс для анимации контента с небольшой задержкой
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        console.log('Modal should be visible now');
    } else {
        console.log('Modal not found!');
    }
}

window.closeWaitlistModal = function() {
    console.log('closeWaitlistModal called');
    const modal = document.getElementById('waitlistModal');
    if (modal) {
        console.log('Hiding modal...');
        // Сначала убираем класс для анимации контента
        modal.classList.remove('show');
        
        // Ждем окончания анимации контента, затем скрываем модальное окно
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            modal.style.zIndex = '-9999';
            modal.style.backdropFilter = 'blur(0px)';
            document.body.classList.remove('modal-open');
        }, 300); // Ждем окончания CSS transition
        
        console.log('Modal should be hidden now');
    }
}

// Add modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up modal...');
    const modal = document.getElementById('waitlistModal');
    const closeBtn = document.querySelector('.close');
    
    console.log('Modal element:', modal);
    console.log('Close button:', closeBtn);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Close button clicked');
            window.closeWaitlistModal();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log('Modal background clicked');
                window.closeWaitlistModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log('Escape key pressed');
            window.closeWaitlistModal();
        }
    });
    
    // Test if functions are available
    console.log('showWaitlistModal available:', typeof window.showWaitlistModal);
    console.log('closeWaitlistModal available:', typeof window.closeWaitlistModal);
    
    // Add click handlers to all waitlist buttons
    const waitlistButtons = document.querySelectorAll('[onclick*="showWaitlistModal"]');
    console.log('Found waitlist buttons:', waitlistButtons.length);
    
    waitlistButtons.forEach((button, index) => {
        console.log(`Button ${index}:`, button);
        button.addEventListener('click', function(e) {
            console.log(`Waitlist button ${index} clicked`);
            e.preventDefault();
            e.stopPropagation();
            window.showWaitlistModal();
        });
    });
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add typing effect to hero title (optional)
    const heroTitle = document.querySelector('.hero-content h1');
    
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.innerHTML = '<span class="typing-text"></span>';
        const typingElement = heroTitle.querySelector('.typing-text');
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                typingElement.textContent = text.substring(0, i + 1);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }
});