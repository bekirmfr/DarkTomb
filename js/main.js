/**
 * Dark Tomb: Bloodthorn Island - Main Initialization
 * Production-ready responsive game initialization
 */

class GameInitializer {
    constructor() {
        this.game = null;
        this.isGameStarted = false;
        this.startModal = null;
        this.loadingStates = {
            dom: false,
            assets: false,
            responsive: false
        };
    }

    /**
     * Initialize the game application
     */
    async init() {
        try {
            console.log('🎮 Initializing Dark Tomb: Bloodthorn Island...');

            // Wait for DOM to be ready
            await this.waitForDOM();
            this.loadingStates.dom = true;
            console.log('✅ DOM ready');

            // Setup responsive system early
            this.setupResponsiveFoundation();
            this.loadingStates.responsive = true;
            console.log('✅ Responsive system ready');

            // Setup start modal
            this.setupStartModal();

            // Pre-load any critical assets
            await this.preloadAssets();
            this.loadingStates.assets = true;
            console.log('✅ Assets loaded');

            // Show the start modal
            this.showStartModal();

            console.log('🎯 Game initialization complete');
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showErrorMessage('Failed to initialize the game. Please refresh and try again.');
        }
    }

    /**
     * Wait for DOM to be fully loaded
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Setup fundamental responsive system before game starts
     */
    setupResponsiveFoundation() {
        // Prevent zoom on double tap globally
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Prevent default touch behaviors that interfere with the game
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        // Setup viewport meta tag for proper mobile rendering
        this.setupViewportMeta();

        // Setup CSS custom properties foundation
        this.setupCSSFoundation();

        // Add global error handling
        this.setupErrorHandling();
    }

    /**
     * Setup viewport meta tag for optimal mobile experience
     */
    setupViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        // Optimal viewport settings for responsive gaming
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    /**
     * Setup foundational CSS custom properties
     */
    setupCSSFoundation() {
        const root = document.documentElement;

        // Calculate initial viewport dimensions
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Set initial responsive values
        root.style.setProperty('--vh', `${vh * 0.01}px`);
        root.style.setProperty('--vw', `${vw * 0.01}px`);

        // Handle viewport changes (especially important for mobile)
        const updateViewportUnits = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            root.style.setProperty('--vh', `${vh * 0.01}px`);
            root.style.setProperty('--vw', `${vw * 0.01}px`);
        };

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateViewportUnits, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(updateViewportUnits, 500);
        });
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (this.game) {
                this.game.showMessage('An error occurred. The game will continue, but you may want to refresh if issues persist.');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }

    /**
     * Pre-load critical assets
     */
    async preloadAssets() {
        // For now, we don't have external assets to load
        // This method is prepared for future asset loading
        return new Promise((resolve) => {
            // Simulate brief loading time for smooth UX
            setTimeout(resolve, 100);
        });
    }

    /**
     * Setup the start modal functionality
     */
    setupStartModal() {
        this.startModal = document.getElementById('game-start-modal');
        const startButton = document.getElementById('start-game-btn');

        if (!this.startModal || !startButton) {
            console.warn('Start modal elements not found, starting game directly');
            this.startGame();
            return;
        }

        // Setup start button
        startButton.addEventListener('click', () => {
            this.handleStartGame();
        });

        // Setup keyboard shortcuts for accessibility
        document.addEventListener('keydown', (event) => {
            if (!this.isGameStarted && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                this.handleStartGame();
            }
        });
    }

    /**
     * Show the start modal with animation
     */
    showStartModal() {
        if (!this.startModal) return;

        this.startModal.style.display = 'flex';

        // Trigger entrance animation
        requestAnimationFrame(() => {
            this.startModal.style.opacity = '1';
        });
    }

    /**
     * Handle start game button click
     */
    async handleStartGame() {
        if (this.isGameStarted) return;

        try {
            // Animate modal exit
            await this.hideStartModal();

            // Start the actual game
            await this.startGame();

        } catch (error) {
            console.error('Failed to start game:', error);
            this.showErrorMessage('Failed to start the game. Please refresh and try again.');
        }
    }

    /**
     * Hide start modal with animation
     */
    hideStartModal() {
        return new Promise((resolve) => {
            if (!this.startModal) {
                resolve();
                return;
            }

            this.startModal.classList.add('modal-exit');

            setTimeout(() => {
                this.startModal.style.display = 'none';
                resolve();
            }, 500); // Match CSS animation duration
        });
    }

    /**
     * Start the main game
     */
    async startGame() {
        if (this.isGameStarted) return;

        try {
            console.log('🚀 Starting game...');

            // Initialize the main game class
            this.game = new Game();
            this.isGameStarted = true;

            // Focus the game container for keyboard events
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.focus();
            }

            console.log('✅ Game started successfully');

        } catch (error) {
            console.error('Failed to start game:', error);
            this.isGameStarted = false;
            this.showErrorMessage('Failed to start the game. Please refresh and try again.');
        }
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // Create error modal if it doesn't exist
        let errorModal = document.getElementById('error-modal');
        if (!errorModal) {
            errorModal = document.createElement('div');
            errorModal.id = 'error-modal';
            errorModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(5px);
            `;

            const errorContent = document.createElement('div');
            errorContent.style.cssText = `
                background: linear-gradient(145deg, #2d1b5b, #4a2574);
                border: 3px solid #e74c3c;
                border-radius: 16px;
                padding: 30px;
                max-width: 90vw;
                max-width: 500px;
                text-align: center;
                color: white;
                box-shadow: 0 20px 60px rgba(231, 76, 60, 0.3);
            `;

            errorContent.innerHTML = `
                <h2 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Error</h2>
                <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
                <button onclick="window.location.reload()" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Refresh Page</button>
            `;

            errorModal.appendChild(errorContent);
            document.body.appendChild(errorModal);
        }

        errorModal.style.display = 'flex';
    }

    /**
     * Get current game instance
     */
    getGame() {
        return this.game;
    }

    /**
     * Check if game is started
     */
    isStarted() {
        return this.isGameStarted;
    }
}

// Global game initializer instance
let gameInitializer;

/**
 * Initialize the application when the page loads
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        gameInitializer = new GameInitializer();
        await gameInitializer.init();
    } catch (error) {
        console.error('Critical initialization error:', error);

        // Fallback error display
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                color: white;
                font-family: 'Segoe UI', sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="color: #e74c3c; margin-bottom: 20px;">Failed to Load Game</h1>
                    <p style="margin-bottom: 20px;">Dark Tomb: Bloodthorn Island could not be initialized.</p>
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(45deg, #e74c3c, #c0392b);
                        border: none;
                        border-radius: 8px;
                        padding: 12px 24px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                    ">Refresh Page</button>
                </div>
            </div>
        `;
    }
});

/**
 * Export for potential module usage
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameInitializer };
}

// Expose globally for debugging
window.gameInitializer = gameInitializer;