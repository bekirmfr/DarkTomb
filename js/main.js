// Initialize game when page loads
window.addEventListener('load', () => {
    // Show the start modal first
    document.getElementById('game-start-modal').style.display = 'flex';

    // Initialize game but don't start yet
    const game = new Game();
    
    // Set up simplified map controls after a short delay
    setTimeout(() => {
        setupSimpleMapControls();
    }, 500);

    // Handle start game button
    document.getElementById('start-game-btn').addEventListener('click', () => {
        // Hide the modal with animation
        const modal = document.getElementById('game-start-modal');
        modal.classList.add('modal-exit');

        setTimeout(() => {
            modal.style.display = 'none';
            // Game is already initialized, just need to make sure everything is ready
            game.showMessage('Welcome to Bloodthorn Island, Kael Shadowbane! Your quest begins now...');
        }, 500);
    });
});

// Simple map control functionality
function setupSimpleMapControls() {
    const mapContainer = document.querySelector('.map-container');
    const levelLayout = document.getElementById('level-layout');
    
    if (!mapContainer || !levelLayout) return;
    
    // Initial scale
    let currentScale = 2.2;
    
    // Set up zoom buttons
    document.getElementById('zoom-in')?.addEventListener('click', function() {
        currentScale = Math.min(currentScale + 0.3, 4);
        levelLayout.style.transform = `scale(${currentScale})`;
    });
    
    document.getElementById('zoom-out')?.addEventListener('click', function() {
        currentScale = Math.max(currentScale - 0.3, 1);
        levelLayout.style.transform = `scale(${currentScale})`;
    });
    
    // Set up navigation buttons
    document.getElementById('nav-up')?.addEventListener('click', function() {
        mapContainer.scrollBy(0, -80);
    });
    
    document.getElementById('nav-down')?.addEventListener('click', function() {
        mapContainer.scrollBy(0, 80);
    });
    
    document.getElementById('nav-left')?.addEventListener('click', function() {
        mapContainer.scrollBy(-80, 0);
    });
    
    document.getElementById('nav-right')?.addEventListener('click', function() {
        mapContainer.scrollBy(80, 0);
    });
}