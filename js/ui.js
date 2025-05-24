// UI-related functions that handle rendering and display updates

function showMessage(text) {
    const existingMessage = document.querySelector('.message-container');
    if (existingMessage) existingMessage.remove();

    const messageEl = document.createElement('div');
    messageEl.className = 'message-container';
    messageEl.innerHTML = `
        <div>${text}</div>
        <button style="margin-top: 10px; padding: 8px 16px; background: #6c5ce7; border: none; border-radius: 4px; color: white; cursor: pointer;" onclick="this.parentElement.remove()">OK</button>
    `;

    document.body.appendChild(messageEl);
    setTimeout(() => {
        if (messageEl.parentNode) messageEl.remove();
    }, 3000);
}

function showDamageNumber(x, y, amount, isHeal = false) {
    // Find the tile in the current card
    const currentCardContainer = document.querySelector(`.card-container.current .card-grid`);
    if (!currentCardContainer) return;

    const tileIndex = y * 7 + x;
    const tile = currentCardContainer.children[tileIndex];
    if (!tile) return;

    const rect = tile.getBoundingClientRect();
    const damageEl = document.createElement('div');
    damageEl.className = `damage-number ${isHeal ? 'heal-number' : ''}`;
    damageEl.textContent = `${isHeal ? '+' : '-'}${amount}`;
    damageEl.style.left = rect.left + rect.width / 2 + 'px';
    damageEl.style.top = rect.top + rect.height / 2 + 'px';

    document.body.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 2000);
}

function updateDisplay(hero, turn, turnPhase, abilityCooldowns) {
    document.getElementById('hero-hp').textContent = `${hero.hp}/${hero.maxHp}`;
    document.getElementById('hero-armor').textContent = hero.armor + hero.bonusArmor;
    document.getElementById('hero-move').textContent = `${hero.remainingMoves}/${hero.move}`;
    document.getElementById('hero-xp').textContent = hero.xp;
    document.getElementById('hero-level').textContent = hero.level;
    document.getElementById('current-card').textContent = `(${hero.cardX},${hero.cardY})`;

    const xpProgress = (hero.xp / (hero.level * 100)) * 100;
    document.getElementById('xp-progress').style.width = xpProgress + '%';

    // Update ability cooldowns and action status
    Object.keys(ABILITIES).forEach(abilityName => {
        const abilityEl = document.querySelector(`[data-ability="${abilityName}"]`);
        const cooldown = abilityCooldowns[abilityName] || 0;

        abilityEl.classList.remove('cooldown');

        if (cooldown > 0) {
            abilityEl.classList.add('cooldown');
            let overlay = abilityEl.querySelector('.cooldown-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'cooldown-overlay';
                abilityEl.appendChild(overlay);
            }
            overlay.textContent = cooldown;
        } else if (hero.hasActed || turnPhase !== 'hero') {
            abilityEl.classList.add('cooldown');
            let overlay = abilityEl.querySelector('.cooldown-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'cooldown-overlay';
                abilityEl.appendChild(overlay);
            }
            overlay.textContent = turnPhase !== 'hero' ? '?' : '?';
        } else {
            const overlay = abilityEl.querySelector('.cooldown-overlay');
            if (overlay) overlay.remove();
        }
    });

    const endTurnBtn = document.getElementById('end-turn-btn');
    if (turnPhase !== 'hero') {
        endTurnBtn.style.background = 'linear-gradient(45deg, #636e72, #2d3436)';
        endTurnBtn.textContent = 'Processing...';
        endTurnBtn.disabled = true;
    } else if (hero.remainingMoves === 0 && hero.hasActed) {
        endTurnBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        endTurnBtn.textContent = 'Turn Complete';
        endTurnBtn.disabled = false;
    } else {
        endTurnBtn.style.background = 'linear-gradient(45deg, #00b894, #00cec9)';
        endTurnBtn.textContent = 'End Turn';
        endTurnBtn.disabled = false;
    }
}

// Other UI functions would be defined here