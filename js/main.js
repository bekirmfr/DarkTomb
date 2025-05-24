// Initialize game when page loads
window.addEventListener('load', () => {
    // Show the start modal first
    document.getElementById('game-start-modal').style.display = 'flex';

    // Initialize game but don't start yet
    const game = new Game();

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