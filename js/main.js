// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        // Show the start modal first
        const modal = document.getElementById('game-start-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Initialize game but don't start yet
        let game = null;

        try {
            game = new Game();
        } catch (error) {
            console.error('Error initializing game:', error);
            showErrorMessage('Failed to initialize game. Please refresh the page.');
            return;
        }

        // Handle start game button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                try {
                    // Hide the modal with animation
                    if (modal) {
                        modal.classList.add('modal-exit');

                        setTimeout(() => {
                            modal.style.display = 'none';
                            // Game is already initialized, just need to make sure everything is ready
                            if (game) {
                                game.showMessage('Welcome to Bloodthorn Island, Kael Shadowbane! Your quest begins now...');
                            }
                        }, 500);
                    }
                } catch (error) {
                    console.error('Error starting game:', error);
                    showErrorMessage('Failed to start game. Please refresh the page.');
                }
            });
        }

        // Add global error handling for the game
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            showErrorMessage('An unexpected error occurred. The game may not function properly.');
        });

        // Add unhandled promise rejection handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showErrorMessage('An unexpected error occurred. The game may not function properly.');
        });

        // Add keyboard shortcuts info
        setTimeout(() => {
            if (game) {
                const helpText = `
                    Keyboard Controls:
                    • WASD / Arrow Keys - Move hero
                    • Space - End turn
                    • C - Character sheet
                    • Escape - Cancel action
                `;
                console.log(helpText);
            }
        }, 2000);

    } catch (error) {
        console.error('Fatal error during initialization:', error);
        showErrorMessage('Critical error: Failed to load game. Please refresh the page.');
    }
});

// Enhanced error message display
function showErrorMessage(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #e74c3c, #c0392b);
        border: 2px solid #ff7675;
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        text-align: center;
        z-index: 9999;
        color: white;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
        backdrop-filter: blur(10px);
        animation: errorSlide 0.5s ease-out;
    `;

    const messageContent = document.createElement('div');
    messageContent.textContent = message;
    messageContent.style.marginBottom = '15px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    closeButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        padding: 8px 16px;
        color: white;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    `;

    closeButton.addEventListener('click', () => errorEl.remove());
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    errorEl.appendChild(messageContent);
    errorEl.appendChild(closeButton);
    document.body.appendChild(errorEl);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorEl.parentNode) errorEl.remove();
    }, 10000);
}

// Add performance monitoring
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.performance && window.performance.timing) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            console.log(`Game loaded in ${loadTime}ms`);

            if (loadTime > 5000) {
                console.warn('Slow loading detected. Consider optimizing assets.');
            }
        }
    }, 1000);
});

// Add CSS animation for error messages
const style = document.createElement('style');
style.textContent = `
    @keyframes errorSlide {
        0% {
            opacity: 0;
            transform: translate(-50%, -70%);
        }
        100% {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }
`;
document.head.appendChild(style);