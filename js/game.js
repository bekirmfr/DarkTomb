class Game {
    constructor() {
        this.hero = {
            x: 3, y: 3, // Position within current card
            cardX: 0, cardY: 0, // Current card coordinates
            hp: 100, maxHp: 100,
            armor: 5, baseArmor: 5,
            move: 3, level: 1, xp: 0,
            bonusArmor: 0, bonusArmorTurns: 0,
            remainingMoves: 3,
            hasActed: false,
            // Character information
            name: "Kael Shadowbane",
            class: "Dungeon Explorer",
            background: "Once a noble knight, now explores the dark depths of Bloodthorn Island seeking ancient treasures and redemption."
        };

        this.currentLevel = 1;
        this.activeCards = new Map(); // Map of "x,y" -> card data
        this.cardDecks = {}; // Level -> array of card templates
        this.levelLayouts = {}; // Level -> array of card coordinates
        this.fogOfWar = new Map(); // Map of "cardX,cardY" -> Set of "x,y" positions

        this.selectedAbility = null;
        this.abilityCooldowns = {};
        this.environmentEffect = null;
        this.environmentTurns = 0;
        this.turn = 1;
        this.turnPhase = 'hero'; // 'hero', 'enemy', 'environment'
        this.mode = 'move';

        this.abilities = {
            strike: {
                modifier: 2,
                damage: 8,
                range: 1,
                type: 'single',
                cooldown: 0,
                name: "Strike",
                description: "A precise melee attack that deals consistent damage to adjacent enemies."
            },
            fireball: {
                modifier: 4,
                damage: 12,
                range: 3,
                type: 'single',
                cooldown: 2,
                name: "Fireball",
                description: "Launch a blazing projectile that deals high damage at range. Requires line of sight."
            },
            heal: {
                modifier: 0,
                damage: -15,
                range: 0,
                type: 'self',
                cooldown: 3,
                name: "Heal",
                description: "Channel divine energy to restore your health and mend wounds."
            },
            charge: {
                modifier: 3,
                damage: 10,
                range: 2,
                type: 'charge',
                cooldown: 2,
                name: "Charge",
                description: "Rush forward to strike an enemy with tremendous force, combining movement and attack."
            },
            shield: {
                modifier: 0,
                damage: 0,
                range: 0,
                type: 'buff',
                cooldown: 4,
                name: "Shield",
                description: "Raise your defenses, gaining bonus armor that protects against incoming attacks."
            }
        };

        this.environmentEffects = [
            { name: 'Earthquake', effect: 'All units take +1 damage', duration: 3 },
            { name: 'Poison Mist', effect: 'All living creatures lose 2 HP per turn', duration: 4 },
            { name: 'Lightning Storm', effect: 'Random electrical damage', duration: 2 },
            { name: 'Bloodthorn Growth', effect: 'Movement costs +1 HP', duration: 3 },
            { name: 'Dark Fog', effect: 'Attack range reduced by 1', duration: 2 }
        ];

        this.initializeLevels();
        this.initializeGame();
        this.bindEvents();
    }

    initializeLevels() {
        // Define level layouts - which card coordinates exist
        this.levelLayouts = {
            1: [
                { x: 0, y: 0 },   // Starting card
                { x: 1, y: 0 },   // East
                { x: 1, y: 1 },   // Southeast
                { x: 0, y: 1 },   // South
                { x: 0, y: -1 }   // North
            ],
            2: [
                { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
                { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
                { x: 0, y: -1 }, { x: 1, y: -1 }
            ]
        };

        // Generate card templates for each level
        this.generateCardDecks();
    }

    generateCardDecks() {
        for (let level = 1; level <= 2; level++) {
            this.cardDecks[level] = [];
            const cardCount = this.levelLayouts[level].length;

            for (let i = 0; i < cardCount; i++) {
                this.cardDecks[level].push(this.generateCardTemplate(level));
            }
        }
    }

    generateCardTemplate(level) {
        const card = {
            terrain: [],
            monsters: [],
            treasures: []
        };

        // Generate terrain
        for (let y = 0; y < 7; y++) {
            card.terrain[y] = [];
            for (let x = 0; x < 7; x++) {
                if (Math.random() < 0.15) {
                    card.terrain[y][x] = 'wall';
                } else {
                    card.terrain[y][x] = 'floor';
                }
            }
        }

        // Generate monsters for this card
        const monsterCount = 2 + Math.floor(level / 2);
        const monsterTypes = [
            { name: 'Goblin', attackRange: 1 },
            { name: 'Orc', attackRange: 1 },
            { name: 'Skeleton', attackRange: 2 },
            { name: 'Spider', attackRange: 1 }
        ];

        for (let i = 0; i < monsterCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 7);
                y = Math.floor(Math.random() * 7);
            } while (
                card.terrain[y][x] === 'wall' ||
                card.monsters.some(m => m.x === x && m.y === y)
            );

            const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
            card.monsters.push({
                x, y,
                hp: 20 + (level * 5),
                maxHp: 20 + (level * 5),
                armor: 3 + Math.floor(level / 2),
                damage: 6 + level,
                type: monsterType.name,
                attackRange: monsterType.attackRange,
                engaged: false,
                cardX: null, // Will be set when card is placed
                cardY: null
            });
        }

        // Generate treasures
        const treasureCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < treasureCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 7);
                y = Math.floor(Math.random() * 7);
            } while (
                card.terrain[y][x] === 'wall' ||
                card.monsters.some(m => m.x === x && m.y === y) ||
                card.treasures.some(t => t.x === x && t.y === y)
            );

            card.treasures.push({ x, y, collected: false });
        }

        return card;
    }

    rotateCard(card, rotation) {
        const rotated = {
            terrain: [],
            monsters: [],
            treasures: []
        };

        // Rotate terrain
        for (let y = 0; y < 7; y++) {
            rotated.terrain[y] = [];
            for (let x = 0; x < 7; x++) {
                const [newX, newY] = this.rotateCoordinates(x, y, rotation);
                rotated.terrain[y][x] = card.terrain[newY][newX];
            }
        }

        // Rotate monsters
        card.monsters.forEach(monster => {
            const [newX, newY] = this.rotateCoordinates(monster.x, monster.y, rotation);
            rotated.monsters.push({
                ...monster,
                x: newX,
                y: newY
            });
        });

        // Rotate treasures
        card.treasures.forEach(treasure => {
            const [newX, newY] = this.rotateCoordinates(treasure.x, treasure.y, rotation);
            rotated.treasures.push({
                ...treasure,
                x: newX,
                y: newY
            });
        });

        return rotated;
    }

    rotateCoordinates(x, y, rotation) {
        const center = 3; // 7x7 grid center
        const relX = x - center;
        const relY = y - center;

        let newRelX, newRelY;
        switch (rotation) {
            case 0: // No rotation
                newRelX = relX;
                newRelY = relY;
                break;
            case 1: // 90° clockwise
                newRelX = -relY;
                newRelY = relX;
                break;
            case 2: // 180°
                newRelX = -relX;
                newRelY = -relY;
                break;
            case 3: // 270° clockwise
                newRelX = relY;
                newRelY = -relX;
                break;
        }

        return [newRelX + center, newRelY + center];
    }

    initializeGame() {
        this.activeCards.clear();
        this.fogOfWar.clear();

        // Place starting card at (0,0)
        this.placeCard(0, 0);

        // Ensure hero starting position is clear
        const startingCard = this.activeCards.get('0,0');
        startingCard.terrain[3][3] = 'floor';

        this.resetTurnActions();
        this.updateVisibility();
        this.updateMonsterEngagement();
        this.updateDisplay();
        this.renderMap();
    }

    placeCard(cardX, cardY) {
        const cardKey = `${cardX},${cardY}`;
        if (this.activeCards.has(cardKey)) return;

        // Check if this card position exists in current level
        const levelLayout = this.levelLayouts[this.currentLevel];
        const cardExists = levelLayout.some(pos => pos.x === cardX && pos.y === cardY);
        if (!cardExists) return;

        // Get card index in layout
        const cardIndex = levelLayout.findIndex(pos => pos.x === cardX && pos.y === cardY);
        if (cardIndex === -1) return;

        // Get card template and rotate randomly
        const originalCard = this.cardDecks[this.currentLevel][cardIndex];
        const rotation = Math.floor(Math.random() * 4);
        const rotatedCard = this.rotateCard(originalCard, rotation);

        // Set card coordinates for monsters
        rotatedCard.monsters.forEach(monster => {
            monster.cardX = cardX;
            monster.cardY = cardY;
        });

        this.activeCards.set(cardKey, {
            ...rotatedCard,
            cardX,
            cardY,
            rotation
        });

        // Initialize fog for this card
        this.fogOfWar.set(cardKey, new Set());

        this.showMessage(`New area discovered! Card placed at (${cardX},${cardY})`);
    }

    getCardAtPosition(cardX, cardY) {
        return this.activeCards.get(`${cardX},${cardY}`);
    }

    getAllMonstersInCard(cardX, cardY) {
        const card = this.getCardAtPosition(cardX, cardY);
        return card ? card.monsters : [];
    }

    getAllMonsters() {
        let allMonsters = [];
        this.activeCards.forEach(card => {
            allMonsters = allMonsters.concat(card.monsters);
        });
        return allMonsters;
    }

    isAdjacentToEnemy(x, y, cardX, cardY) {
        const monsters = this.getAllMonstersInCard(cardX, cardY);
        return monsters.some(monster => {
            const distance = Math.abs(monster.x - x) + Math.abs(monster.y - y);
            return distance === 1;
        });
    }

    updateVisibility() {
        const visionRadius = 1;
        const { cardX, cardY, x: heroX, y: heroY } = this.hero;

        // Get or create fog set for current card
        const cardKey = `${cardX},${cardY}`;
        if (!this.fogOfWar.has(cardKey)) {
            this.fogOfWar.set(cardKey, new Set());
        }
        const fogSet = this.fogOfWar.get(cardKey);

        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const x = heroX + dx;
                const y = heroY + dy;

                if (x >= 0 && x < 7 && y >= 0 && y < 7) {
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance <= visionRadius) {
                        fogSet.add(`${x},${y}`);
                    }
                }
            }
        }
    }

    isHeroOnEdge() {
        const { x, y } = this.hero;
        return x === 0 || x === 6 || y === 0 || y === 6;
    }

    resetTurnActions() {
        this.hero.remainingMoves = this.hero.move;
        this.hero.hasActed = false;
        this.turnPhase = 'hero';
        this.clearAllHighlights();
        this.updateTurnDisplay();
    }

    updateTurnDisplay() {
        document.getElementById('turn-number').textContent = this.turn;
        const phaseEl = document.getElementById('turn-phase');

        phaseEl.classList.remove('hero', 'enemy', 'environment');
        phaseEl.classList.add(this.turnPhase);

        switch (this.turnPhase) {
            case 'hero':
                phaseEl.textContent = 'Hero Phase';
                break;
            case 'enemy':
                phaseEl.textContent = 'Enemy Phase';
                break;
            case 'environment':
                phaseEl.textContent = 'Environment Phase';
                break;
        }
    }

    bindEvents() {
        // Ability selection
        document.querySelectorAll('.ability').forEach(ability => {
            ability.addEventListener('click', (e) => {
                const abilityName = e.currentTarget.dataset.ability;
                if (!this.abilityCooldowns[abilityName] && !this.hero.hasActed && this.turnPhase === 'hero') {
                    this.selectAbility(abilityName);
                } else if (this.hero.hasActed) {
                    this.showMessage('You have already acted this turn!');
                } else if (this.turnPhase !== 'hero') {
                    this.showMessage('Wait for your turn!');
                }
            });
        });

        // Action buttons
        document.getElementById('move-btn').addEventListener('click', () => {
            if (this.hero.remainingMoves > 0 && this.turnPhase === 'hero') {
                this.mode = 'move';
                this.selectedAbility = null;
                this.highlightMovementRange();
                this.updateModeDisplay();
                // Clear ability selection
                document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
            }
        });

        document.getElementById('attack-btn').addEventListener('click', () => {
            if (!this.hero.hasActed && this.turnPhase === 'hero') {
                this.mode = 'attack';
                this.selectedAbility = 'strike';
                this.highlightAbilityRange();
                this.updateModeDisplay();
                // Highlight strike ability
                document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
                document.querySelector(`[data-ability="strike"]`).classList.add('selected');
            }
        });

        document.getElementById('end-turn-btn').addEventListener('click', () => {
            if (this.turnPhase === 'hero') {
                this.clearAllHighlights();
                this.endHeroTurn();
            }
        });

        document.getElementById('dice').addEventListener('click', () => {
            this.rollDice();
        });
    }

    selectAbility(abilityName) {
        if (this.hero.hasActed || this.turnPhase !== 'hero') {
            this.showMessage('You have already acted this turn!');
            return;
        }

        this.selectedAbility = abilityName;
        this.mode = 'ability';
        this.highlightAbilityRange();
        this.updateModeDisplay();

        document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
        document.querySelector(`[data-ability="${abilityName}"]`).classList.add('selected');
    }

    highlightMovementRange() {
        this.clearAllHighlights();

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        if (!currentCard) return;

        const { x: heroX, y: heroY } = this.hero;
        const reachableTiles = this.calculateReachableTiles(heroX, heroY, this.hero.remainingMoves, currentCard);

        // Highlight reachable tiles
        reachableTiles.forEach(pos => {
            const cardContainer = document.querySelector(`.card-container.current .card-grid`);
            if (cardContainer) {
                const tileIndex = pos.y * 7 + pos.x;
                const tile = cardContainer.children[tileIndex];
                if (tile) {
                    tile.classList.add('movement-range');
                }
            }
        });
    }

    highlightAbilityRange() {
        this.clearAllHighlights();

        if (!this.selectedAbility) return;

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        if (!currentCard) return;

        const ability = this.abilities[this.selectedAbility];
        let effectiveRange = ability.range;

        // Apply environmental effects
        if (this.environmentEffect && this.environmentEffect.name === 'Dark Fog' && ability.range > 0) {
            effectiveRange = Math.max(1, ability.range - 1);
        }

        // Skip range highlighting for self-target abilities
        if (ability.type === 'self' || ability.type === 'buff') {
            return;
        }

        const { x: heroX, y: heroY } = this.hero;
        const inRangeTiles = this.calculateAbilityRange(heroX, heroY, effectiveRange, currentCard);

        // Highlight tiles in range
        inRangeTiles.forEach(pos => {
            const cardContainer = document.querySelector(`.card-container.current .card-grid`);
            if (cardContainer) {
                const tileIndex = pos.y * 7 + pos.x;
                const tile = cardContainer.children[tileIndex];
                if (tile) {
                    tile.classList.add('ability-range');
                }
            }
        });
    }

    clearAllHighlights() {
        document.querySelectorAll('.card-tile.movement-range').forEach(tile => {
            tile.classList.remove('movement-range');
        });
        document.querySelectorAll('.card-tile.ability-range').forEach(tile => {
            tile.classList.remove('ability-range');
        });
    }

    calculateReachableTiles(startX, startY, maxMoves, card) {
        const reachable = [];
        const visited = new Map(); // Store position -> minimum moves needed to reach
        const queue = [{ x: startX, y: startY, moves: maxMoves, path: [] }];

        while (queue.length > 0) {
            const { x, y, moves, path } = queue.shift();
            const key = `${x},${y}`;

            // Skip if we've visited this tile with better or equal moves
            if (visited.has(key) && visited.get(key) >= moves) continue;
            if (moves < 0) continue;

            visited.set(key, moves);

            // Don't include starting position in reachable tiles
            if (!(x === startX && y === startY)) {
                reachable.push({ x, y, moves, path: [...path] });
            }

            if (moves > 0) {
                const neighbors = [
                    { x: x + 1, y: y },
                    { x: x - 1, y: y },
                    { x: x, y: y + 1 },
                    { x: x, y: y - 1 }
                ];

                neighbors.forEach(neighbor => {
                    if (neighbor.x >= 0 && neighbor.x < 7 && neighbor.y >= 0 && neighbor.y < 7) {
                        // Check if tile is passable (not wall, not monster)
                        if (card.terrain[neighbor.y][neighbor.x] !== 'wall' &&
                            !card.monsters.some(m => m.x === neighbor.x && m.y === neighbor.y)) {

                            // Calculate movement cost for this step
                            let moveCost = 1;

                            // Check adjacency rules
                            const currentAdjacent = this.isAdjacentToEnemy(x, y, this.hero.cardX, this.hero.cardY);
                            const targetAdjacent = this.isAdjacentToEnemy(neighbor.x, neighbor.y, this.hero.cardX, this.hero.cardY);

                            // If moving from non-adjacent to adjacent position, it costs all remaining moves
                            if (!currentAdjacent && targetAdjacent) {
                                moveCost = moves; // Consume all remaining movement
                            }

                            const newMoves = moves - moveCost;
                            const newPath = [...path, { x: neighbor.x, y: neighbor.y }];

                            // Only add to queue if we have enough moves and haven't visited with better moves
                            if (newMoves >= 0 && (!visited.has(`${neighbor.x},${neighbor.y}`) || visited.get(`${neighbor.x},${neighbor.y}`) < newMoves)) {
                                queue.push({
                                    x: neighbor.x,
                                    y: neighbor.y,
                                    moves: newMoves,
                                    path: newPath
                                });
                            }
                        }
                    }
                });
            }
        }

        return reachable;
    }

    calculateAbilityRange(centerX, centerY, range, card) {
        const inRange = [];

        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const distance = Math.abs(x - centerX) + Math.abs(y - centerY);

                if (distance <= range && distance > 0) {
                    // Check if there's a clear line (for most abilities)
                    if (this.hasLineOfSight(centerX, centerY, x, y, card)) {
                        inRange.push({ x, y, distance });
                    }
                }
            }
        }

        return inRange;
    }

    hasLineOfSight(x1, y1, x2, y2, card) {
        // Simple line of sight check - can be improved with Bresenham's line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            // Don't check the starting position or target position for walls
            if (!(x === x1 && y === y1) && !(x === x2 && y === y2)) {
                if (card.terrain[y][x] === 'wall') {
                    return false; // Line blocked by wall
                }
            }

            if (x === x2 && y === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true;
    }

    handleTileClick(x, y) {
        if (this.turnPhase !== 'hero') {
            this.showMessage('Wait for your turn!');
            return;
        }

        if (this.mode === 'move') {
            this.moveHero(x, y);
        } else if ((this.mode === 'attack' || this.mode === 'ability') && this.selectedAbility) {
            this.useAbility(x, y);
        }
    }

    moveHero(x, y) {
        // Check if trying to move outside current card - not allowed anymore
        if (x < 0 || x >= 7 || y < 0 || y >= 7) {
            this.showMessage('Use card transitions to move between areas!');
            return;
        }

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);

        // Check if destination is blocked
        if (currentCard.terrain[y][x] === 'wall' ||
            currentCard.monsters.some(m => m.x === x && m.y === y)) {
            this.showMessage('That tile is blocked!');
            return;
        }

        // Validate movement using the same pathfinding algorithm as highlighting
        const reachableTiles = this.calculateReachableTiles(this.hero.x, this.hero.y, this.hero.remainingMoves, currentCard);
        const targetTile = reachableTiles.find(tile => tile.x === x && tile.y === y);

        if (!targetTile) {
            this.showMessage('Cannot reach that tile with remaining movement!');
            return;
        }

        // Calculate the actual movement cost to reach this tile
        const movementCost = this.hero.remainingMoves - targetTile.moves;

        // Perform the movement
        this.hero.remainingMoves -= movementCost;
        this.hero.x = x;
        this.hero.y = y;

        // Clear movement highlights after moving
        this.clearAllHighlights();

        this.updateVisibility();
        this.updateMonsterEngagement();

        // Apply environmental effects
        if (this.environmentEffect && this.environmentEffect.name === 'Bloodthorn Growth') {
            this.takeDamage(this.hero, 1);
            this.showDamageNumber(x, y, 1, false);
        }

        // Check for treasure
        const treasure = currentCard.treasures.find(t => t.x === x && t.y === y && !t.collected);
        if (treasure) {
            treasure.collected = true;
            this.gainXP(25);
            this.showMessage('Treasure found! +25 XP');
        }

        this.checkTurnComplete();
        this.renderMap();
    }

    useAbility(x, y) {
        if (this.hero.hasActed || this.turnPhase !== 'hero') {
            this.showMessage('You have already acted this turn!');
            return;
        }

        const ability = this.abilities[this.selectedAbility];
        let effectiveRange = ability.range;

        if (this.environmentEffect && this.environmentEffect.name === 'Dark Fog' && ability.range > 0) {
            effectiveRange = Math.max(1, ability.range - 1);
        }

        // For self-target abilities, ignore position
        if (ability.type === 'self' || ability.type === 'buff') {
            this.hero.hasActed = true;
            if (ability.type === 'self') {
                this.applySelfAbility();
            } else if (ability.type === 'buff') {
                this.applyBuffAbility();
            }
            this.checkTurnComplete();
            return;
        }

        // Validate target is in range and has line of sight
        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        const inRangeTiles = this.calculateAbilityRange(this.hero.x, this.hero.y, effectiveRange, currentCard);
        const targetTile = inRangeTiles.find(tile => tile.x === x && tile.y === y);

        if (!targetTile) {
            this.showMessage('Target is out of range or blocked!');
            return;
        }

        // Check if there's a valid target at the position
        const target = currentCard.monsters.find(m => m.x === x && m.y === y);
        if (!target) {
            this.showMessage('No valid target at that position!');
            return;
        }

        this.hero.hasActed = true;
        this.rollDice(() => this.attackTarget(target, ability));
        this.checkTurnComplete();
    }

    applySelfAbility() {
        const ability = this.abilities[this.selectedAbility];
        if (this.selectedAbility === 'heal') {
            const healAmount = Math.abs(ability.damage);
            this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + healAmount);
            this.showDamageNumber(this.hero.x, this.hero.y, healAmount, true);
            this.setCooldown(this.selectedAbility, ability.cooldown);
            this.updateDisplay();
        }
    }

    applyBuffAbility() {
        if (this.selectedAbility === 'shield') {
            this.hero.bonusArmor = 2;
            this.hero.bonusArmorTurns = 3;
            this.setCooldown(this.selectedAbility, this.abilities[this.selectedAbility].cooldown);
            this.showMessage('Shield activated! +2 Armor for 3 turns');
            this.updateDisplay();
        }
    }

    rollDice(callback) {
        const dice = document.getElementById('dice');
        dice.classList.add('rolling');

        let rollCount = 0;
        const rollInterval = setInterval(() => {
            const value = Math.floor(Math.random() * 20) + 1;
            dice.textContent = value;
            rollCount++;

            if (rollCount >= 10) {
                clearInterval(rollInterval);
                dice.classList.remove('rolling');

                if (value >= 19) {
                    this.triggerEnvironmentalEffect();
                }

                if (callback) callback(value);
            }
        }, 100);
    }

    attackTarget(target, ability) {
        const diceValue = parseInt(document.getElementById('dice').textContent);
        const attackRoll = diceValue + ability.modifier;
        let damage = ability.damage;

        if (this.environmentEffect && this.environmentEffect.name === 'Earthquake') {
            damage += 1;
        }

        if (attackRoll >= target.armor) {
            this.takeDamage(target, damage);
            this.showDamageNumber(target.x, target.y, damage, false);
            this.gainXP(10);

            if (target.hp <= 0) {
                const currentCard = this.getCardAtPosition(target.cardX, target.cardY);
                currentCard.monsters = currentCard.monsters.filter(m => m !== target);
                this.gainXP(50);
                this.checkWinCondition();
            }
        } else {
            this.showMessage('Attack missed!');
        }

        this.setCooldown(this.selectedAbility, ability.cooldown);
        this.updateDisplay();
        this.renderMap();
    }

    takeDamage(unit, damage) {
        if (unit === this.hero) {
            const effectiveArmor = this.hero.armor + this.hero.bonusArmor;
            const reducedDamage = Math.max(1, damage - Math.floor(effectiveArmor / 2));
            unit.hp -= reducedDamage;
        } else {
            unit.hp -= damage;
        }

        if (unit.hp < 0) unit.hp = 0;
    }

    triggerEnvironmentalEffect() {
        this.environmentEffect = this.environmentEffects[Math.floor(Math.random() * this.environmentEffects.length)];
        this.environmentTurns = this.environmentEffect.duration;

        const effectDiv = document.getElementById('environment-effect');
        effectDiv.textContent = `${this.environmentEffect.name}: ${this.environmentEffect.effect}`;
        effectDiv.style.display = 'block';

        this.showMessage(`Environmental Effect: ${this.environmentEffect.name}!`);
    }

    checkTurnComplete() {
        if (this.hero.remainingMoves === 0 && this.hero.hasActed) {
            setTimeout(() => this.endHeroTurn(), 500);
        } else {
            this.updateDisplay();
        }
    }

    endHeroTurn() {
        this.turnPhase = 'enemy';
        this.updateTurnDisplay();

        setTimeout(() => {
            this.processEnemyPhase();
        }, 1000);
    }

    processEnemyPhase() {
        const allMonsters = this.getAllMonsters();
        let processed = 0;

        const processNextMonster = () => {
            if (processed >= allMonsters.length) {
                this.turnPhase = 'environment';
                this.updateTurnDisplay();
                setTimeout(() => this.processEnvironmentPhase(), 1000);
                return;
            }

            const monster = allMonsters[processed];
            this.monsterAction(monster);
            processed++;

            setTimeout(processNextMonster, 500);
        };

        processNextMonster();
    }

    processEnvironmentPhase() {
        // Environmental effects
        if (this.environmentEffect) {
            this.applyEnvironmentalEffects();
            this.environmentTurns--;
            if (this.environmentTurns <= 0) {
                this.environmentEffect = null;
                document.getElementById('environment-effect').style.display = 'none';
            }
        }

        // Reduce cooldowns
        Object.keys(this.abilityCooldowns).forEach(ability => {
            if (this.abilityCooldowns[ability] > 0) {
                this.abilityCooldowns[ability]--;
            }
        });

        // Reduce buff durations
        if (this.hero.bonusArmorTurns > 0) {
            this.hero.bonusArmorTurns--;
            if (this.hero.bonusArmorTurns === 0) {
                this.hero.bonusArmor = 0;
            }
        }

        this.turn++;
        this.resetTurnActions();
        this.updateDisplay();
        this.updateModeDisplay();
        this.renderMap();

        if (this.hero.hp <= 0) {
            this.showMessage('Game Over! You have been defeated.');
        }
    }

    updateMonsterEngagement() {
        this.activeCards.forEach(card => {
            card.monsters.forEach(monster => {
                // Engage monsters within range of hero regardless of card
                const heroCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
                if (heroCard && monster.cardX === this.hero.cardX && monster.cardY === this.hero.cardY) {
                    const distance = Math.abs(monster.x - this.hero.x) + Math.abs(monster.y - this.hero.y);
                    if (distance <= monster.attackRange + 2) { // Slightly larger engagement range
                        monster.engaged = true;
                    }
                }
            });
        });
    }

    monsterAction(monster) {
        if (!monster.engaged) return;

        const heroDistance = this.getDistanceToHero(monster);

        // If hero is in different card and monster is close to edge, try to follow
        if (monster.cardX !== this.hero.cardX || monster.cardY !== this.hero.cardY) {
            this.tryMonsterCardTransition(monster);
            return;
        }

        // If in same card, normal behavior
        if (heroDistance <= monster.attackRange) {
            // Attack hero
            const attackRoll = Math.floor(Math.random() * 20) + 1 + 2;
            let damage = monster.damage;

            if (this.environmentEffect && this.environmentEffect.name === 'Earthquake') {
                damage += 1;
            }

            if (attackRoll >= this.hero.armor + this.hero.bonusArmor) {
                this.takeDamage(this.hero, damage);
                this.showDamageNumber(this.hero.x, this.hero.y, damage, false);
                this.showMessage(`${monster.type} attacks for ${damage} damage!`);
            } else {
                this.showMessage(`${monster.type} attacks but misses!`);
            }
        } else {
            // Move towards hero
            this.moveMonsterTowardsHero(monster);
        }
    }

    getDistanceToHero(monster) {
        if (monster.cardX !== this.hero.cardX || monster.cardY !== this.hero.cardY) {
            return Infinity; // Different cards
        }
        return Math.abs(monster.x - this.hero.x) + Math.abs(monster.y - this.hero.y);
    }

    tryMonsterCardTransition(monster) {
        // Check if monster is on edge of its current card
        const isOnEdge = monster.x === 0 || monster.x === 6 || monster.y === 0 || monster.y === 6;
        if (!isOnEdge) {
            // Move towards closest edge that leads to hero
            this.moveMonsterTowardsCardEdge(monster);
            return;
        }

        // Determine which adjacent card the hero is in
        const deltaCardX = this.hero.cardX - monster.cardX;
        const deltaCardY = this.hero.cardY - monster.cardY;

        // Only allow movement to adjacent cards
        if (Math.abs(deltaCardX) + Math.abs(deltaCardY) === 1) {
            let newCardX = monster.cardX;
            let newCardY = monster.cardY;
            let newX = monster.x;
            let newY = monster.y;

            if (deltaCardX > 0 && monster.x === 6) { // Move east
                newCardX++;
                newX = 0;
            } else if (deltaCardX < 0 && monster.x === 0) { // Move west
                newCardX--;
                newX = 6;
            } else if (deltaCardY > 0 && monster.y === 6) { // Move south
                newCardY++;
                newY = 0;
            } else if (deltaCardY < 0 && monster.y === 0) { // Move north
                newCardY--;
                newY = 6;
            }

            // Check if target card exists and position is valid
            const targetCard = this.getCardAtPosition(newCardX, newCardY);
            if (targetCard && targetCard.terrain[newY][newX] !== 'wall' &&
                !targetCard.monsters.some(m => m.x === newX && m.y === newY)) {

                // Remove monster from old card
                const oldCard = this.getCardAtPosition(monster.cardX, monster.cardY);
                oldCard.monsters = oldCard.monsters.filter(m => m !== monster);

                // Add monster to new card
                monster.cardX = newCardX;
                monster.cardY = newCardY;
                monster.x = newX;
                monster.y = newY;
                targetCard.monsters.push(monster);

                this.showMessage(`${monster.type} follows you to (${newCardX},${newCardY})!`);
            }
        }
    }

    moveMonsterTowardsCardEdge(monster) {
        const deltaCardX = this.hero.cardX - monster.cardX;
        const deltaCardY = this.hero.cardY - monster.cardY;

        let targetX = monster.x;
        let targetY = monster.y;

        // Move towards the edge that leads to hero's card
        if (deltaCardX > 0) targetX = Math.min(6, monster.x + 1);
        else if (deltaCardX < 0) targetX = Math.max(0, monster.x - 1);

        if (deltaCardY > 0) targetY = Math.min(6, monster.y + 1);
        else if (deltaCardY < 0) targetY = Math.max(0, monster.y - 1);

        const card = this.getCardAtPosition(monster.cardX, monster.cardY);
        if (card.terrain[targetY][targetX] !== 'wall' &&
            !card.monsters.some(m => m.x === targetX && m.y === targetY && m !== monster)) {
            monster.x = targetX;
            monster.y = targetY;
        }
    }

    moveMonsterTowardsHero(monster) {
        const card = this.getCardAtPosition(monster.cardX, monster.cardY);
        let bestMove = { x: monster.x, y: monster.y };
        let bestDistance = this.getDistanceToHero(monster);

        const moves = [
            { x: monster.x + 1, y: monster.y },
            { x: monster.x - 1, y: monster.y },
            { x: monster.x, y: monster.y + 1 },
            { x: monster.x, y: monster.y - 1 }
        ];

        moves.forEach(move => {
            if (move.x >= 0 && move.x < 7 && move.y >= 0 && move.y < 7 &&
                card.terrain[move.y][move.x] !== 'wall' &&
                !card.monsters.some(m => m.x === move.x && m.y === move.y && m !== monster)) {

                const newDistance = Math.abs(move.x - this.hero.x) + Math.abs(move.y - this.hero.y);
                if (newDistance < bestDistance) {
                    bestDistance = newDistance;
                    bestMove = move;
                }
            }
        });

        monster.x = bestMove.x;
        monster.y = bestMove.y;
    }

    applyEnvironmentalEffects() {
        if (!this.environmentEffect) return;

        switch (this.environmentEffect.name) {
            case 'Poison Mist':
                this.takeDamage(this.hero, 2);
                this.showDamageNumber(this.hero.x, this.hero.y, 2, false);

                this.getAllMonsters().forEach(monster => {
                    this.takeDamage(monster, 2);
                    this.showDamageNumber(monster.x, monster.y, 2, false);
                });
                break;

            case 'Lightning Storm':
                if (Math.random() < 0.3) {
                    const damage = Math.floor(Math.random() * 8) + 3;
                    this.takeDamage(this.hero, damage);
                    this.showDamageNumber(this.hero.x, this.hero.y, damage, false);
                }
                break;
        }
    }

    setCooldown(ability, turns) {
        this.abilityCooldowns[ability] = turns;
    }

    gainXP(amount) {
        this.hero.xp += amount;
        const xpNeeded = this.hero.level * 100;

        if (this.hero.xp >= xpNeeded) {
            this.hero.level++;
            this.hero.xp -= xpNeeded;
            this.hero.maxHp += 20;
            this.hero.hp = this.hero.maxHp;
            this.hero.armor++;
            this.showMessage(`Level Up! You are now level ${this.hero.level}`);
        }
    }

    checkWinCondition() {
        const totalMonsters = this.getAllMonsters().length;

        if (totalMonsters === 0) {
            this.showMessage('Victory! All monsters defeated. Generating new level...');
            setTimeout(() => {
                this.currentLevel++;
                if (this.levelLayouts[this.currentLevel]) {
                    this.hero.cardX = 0;
                    this.hero.cardY = 0;
                    this.hero.x = 3;
                    this.hero.y = 3;
                    this.initializeGame();
                } else {
                    this.showMessage('Congratulations! You have completed all levels!');
                }
            }, 2000);
        }
    }

    showDamageNumber(x, y, amount, isHeal = false) {
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

    showCharacterSheet(unit = null) {
        // Use hero as default if no unit provided
        const character = unit || this.hero;

        // Remove any existing character sheet
        const existingSheet = document.querySelector('.character-sheet');
        if (existingSheet) existingSheet.remove();

        // Create character sheet modal
        const characterSheet = document.createElement('div');
        characterSheet.className = `character-sheet ${character.unitType || 'hero'}`;

        const content = document.createElement('div');
        content.className = 'character-sheet-content';

        // Calculate derived stats based on unit type
        let totalArmor, hpPercent, xpPercent = 0;

        if (character === this.hero) {
            totalArmor = this.hero.armor + this.hero.bonusArmor;
            const xpNeeded = this.hero.level * 100;
            hpPercent = (this.hero.hp / this.hero.maxHp) * 100;
            xpPercent = (this.hero.xp / xpNeeded) * 100;
        } else {
            totalArmor = character.armor;
            hpPercent = (character.hp / character.maxHp) * 100;
        }

        // Get appropriate icon based on unit type
        const getUnitIcon = (unitType) => {
            switch (unitType) {
                case 'enemy': return '👹';
                case 'ally': return '🤝';
                default: return '🦸';
            }
        };

        // Get appropriate title based on unit type
        const getUnitTitle = (unitType) => {
            switch (unitType) {
                case 'enemy': return '⚔️ Enemy Information';
                case 'ally': return '🤝 Ally Information';
                default: return '⚔️ Character Sheet';
            }
        };

        content.innerHTML = `
                        <div class="character-header">
                            <div class="character-name">${character.name || character.type}</div>
                            <div class="character-class">${character.class}</div>
                            <div class="character-portrait">${getUnitIcon(character.unitType)}</div>
                            <div style="font-size: 14px; color: #bbb; line-height: 1.4; margin-top: 10px;">
                                ${character.background}
                            </div>
                            ${character.unitType === 'enemy' ? `
                                <div style="font-size: 12px; color: #e17055; margin-top: 8px; font-weight: bold;">
                                    ⚠️ Threat Level: ${character.level || 1}
                                </div>
                            ` : ''}
                        </div>

                        <div class="character-stats">
                            <div class="stat-group">
                                <h3>Combat Stats</h3>
                                <div class="stat-row">
                                    <div class="stat-label">
                                        <div class="stat-icon hp-icon">♥</div>
                                        Health
                                    </div>
                                    <div class="stat-value">${character.hp}/${character.maxHp}</div>
                                </div>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill hp" style="width: ${hpPercent}%"></div>
                                </div>

                                <div class="stat-row">
                                    <div class="stat-label">
                                        <div class="stat-icon armor-icon">🛡</div>
                                        Armor
                                    </div>
                                    <div class="stat-value">${totalArmor}</div>
                                </div>
                                ${character === this.hero && this.hero.bonusArmor > 0 ? `
                                    <div style="font-size: 12px; color: #00cec9; margin-left: 28px;">
                                        +${this.hero.bonusArmor} bonus (${this.hero.bonusArmorTurns} turns)
                                    </div>
                                ` : ''}

                                ${character === this.hero ? `
                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <div class="stat-icon move-icon">👟</div>
                                            Movement
                                        </div>
                                        <div class="stat-value">${this.hero.move}</div>
                                    </div>
                                ` : ''}

                                ${character.damage ? `
                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #e74c3c;">⚔️</span>
                                            Attack Damage
                                        </div>
                                        <div class="stat-value">${character.damage}</div>
                                    </div>
                                ` : ''}

                                ${character.attackRange ? `
                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #74b9ff;">📏</span>
                                            Attack Range
                                        </div>
                                        <div class="stat-value">${character.attackRange}</div>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="stat-group">
                                <h3>${character === this.hero ? 'Character Progress' : 'Status Information'}</h3>

                                ${character === this.hero ? `
                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #74b9ff;">⚔️</span>
                                            Level
                                        </div>
                                        <div class="stat-value">${this.hero.level}</div>
                                    </div>

                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <div class="stat-icon xp-icon">⭐</div>
                                            Experience
                                        </div>
                                        <div class="stat-value">${this.hero.xp}/${this.hero.level * 100}</div>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-bar-fill xp" style="width: ${xpPercent}%"></div>
                                    </div>

                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #6c5ce7;">🗺️</span>
                                            Location
                                        </div>
                                        <div class="stat-value">(${this.hero.cardX},${this.hero.cardY})</div>
                                    </div>

                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #f39c12;">🏰</span>
                                            Current Level
                                        </div>
                                        <div class="stat-value">${this.currentLevel}</div>
                                    </div>
                                ` : `
                                    ${character.level ? `
                                        <div class="stat-row">
                                            <div class="stat-label">
                                                <span style="color: #e17055;">💀</span>
                                                Threat Level
                                            </div>
                                            <div class="stat-value">${character.level}</div>
                                        </div>
                                    ` : ''}

                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: #6c5ce7;">🗺️</span>
                                            Location
                                        </div>
                                        <div class="stat-value">(${character.cardX || 0},${character.cardY || 0})</div>
                                    </div>

                                    <div class="stat-row">
                                        <div class="stat-label">
                                            <span style="color: ${character.engaged ? '#e74c3c' : '#95a5a6'};">⚡</span>
                                            Status
                                        </div>
                                        <div class="stat-value" style="color: ${character.engaged ? '#e74c3c' : '#95a5a6'};">
                                            ${character.engaged ? 'ENGAGED' : 'Dormant'}
                                        </div>
                                    </div>

                                    ${character.unitType === 'enemy' ? `
                                        <div class="stat-row">
                                            <div class="stat-label">
                                                <span style="color: #e17055;">🎯</span>
                                                Behavior
                                            </div>
                                            <div class="stat-value">
                                                ${character.engaged ? 'Hostile' : 'Patrolling'}
                                            </div>
                                        </div>
                                    ` : ''}
                                `}
                            </div>
                        </div>

                        <div class="abilities-section">
                            <h3>${getUnitTitle(character.unitType)}</h3>
                            <div class="abilities-grid">
                                ${character === this.hero ?
                // Hero abilities
                Object.entries(this.abilities).map(([key, ability]) => {
                    const cooldown = this.abilityCooldowns[key] || 0;
                    const isOnCooldown = cooldown > 0;

                    return `
                                            <div class="ability-card ${isOnCooldown ? 'on-cooldown' : ''}">
                                                <div class="ability-header">
                                                    <div class="ability-title">${ability.name}</div>
                                                    ${isOnCooldown ? `<div class="ability-cooldown">Cooldown: ${cooldown}</div>` : ''}
                                                </div>
                                                <div class="ability-description">${ability.description}</div>
                                                <div class="ability-stats">
                                                    ${ability.damage !== 0 ? `<div class="ability-stat">
                                                        <span style="color: ${ability.damage > 0 ? '#e74c3c' : '#2ecc71'};">⚔️</span>
                                                        ${ability.damage > 0 ? 'Damage' : 'Healing'}: ${Math.abs(ability.damage)}
                                                    </div>` : ''}
                                                    ${ability.range > 0 ? `<div class="ability-stat">
                                                        <span style="color: #74b9ff;">📏</span>
                                                        Range: ${ability.range}
                                                    </div>` : ''}
                                                    ${ability.modifier !== 0 ? `<div class="ability-stat">
                                                        <span style="color: #f39c12;">🎯</span>
                                                        Bonus: +${ability.modifier}
                                                    </div>` : ''}
                                                    ${ability.cooldown > 0 ? `<div class="ability-stat">
                                                        <span style="color: #636e72;">⏰</span>
                                                        Cooldown: ${ability.cooldown}
                                                    </div>` : ''}
                                                </div>
                                            </div>
                                        `;
                }).join('')
                :
                // Enemy/other unit abilities
                (character.abilities || []).map(abilityName => {
                    const abilityDescriptions = {
                        'Backstab': 'Deals extra damage when attacking from behind or when the target is distracted.',
                        'Pack Hunt': 'Gains damage bonus when other goblins are nearby.',
                        'Rage': 'Enters a berserker rage, increasing damage but reducing armor.',
                        'Intimidate': 'Causes fear in nearby enemies, reducing their accuracy.',
                        'Piercing Shot': 'Arrow ignores armor and can hit multiple targets in a line.',
                        'Bone Armor': 'Supernatural protection that reduces incoming damage.',
                        'Venom Strike': 'Bite inflicts poison that deals damage over time.',
                        'Web Trap': 'Creates sticky webs that immobilize enemies.'
                    };

                    return `
                                            <div class="ability-card">
                                                <div class="ability-header">
                                                    <div class="ability-title">${abilityName}</div>
                                                </div>
                                                <div class="ability-description">
                                                    ${abilityDescriptions[abilityName] || 'A special ability unique to this creature.'}
                                                </div>
                                                <div class="ability-stats">
                                                    <div class="ability-stat">
                                                        <span style="color: #e17055;">💀</span>
                                                        ${character.unitType === 'enemy' ? 'Hostile Ability' : 'Special Ability'}
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                }).join('') ||
                `<div class="ability-card">
                                        <div class="ability-header">
                                            <div class="ability-title">No Special Abilities</div>
                                        </div>
                                        <div class="ability-description">
                                            This ${character.unitType || 'character'} relies on basic combat techniques.
                                        </div>
                                    </div>`
            }
                            </div>
                        </div>

                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
                            Close ${character === this.hero ? 'Character Sheet' : 'Information'}
                        </button>
                    `;

        characterSheet.appendChild(content);
        document.body.appendChild(characterSheet);

        // Add click-to-close functionality
        characterSheet.addEventListener('click', (e) => {
            if (e.target === characterSheet) {
                characterSheet.remove();
            }
        });
    }

    showMessage(text) {
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

    updateDisplay() {
        document.getElementById('hero-hp').textContent = `${this.hero.hp}/${this.hero.maxHp}`;
        document.getElementById('hero-armor').textContent = this.hero.armor + this.hero.bonusArmor;
        document.getElementById('hero-move').textContent = `${this.hero.remainingMoves}/${this.hero.move}`;
        document.getElementById('hero-xp').textContent = this.hero.xp;
        document.getElementById('hero-level').textContent = this.hero.level;
        document.getElementById('current-card').textContent = `(${this.hero.cardX},${this.hero.cardY})`;

        const xpProgress = (this.hero.xp / (this.hero.level * 100)) * 100;
        document.getElementById('xp-progress').style.width = xpProgress + '%';

        // Update ability cooldowns and action status
        Object.keys(this.abilities).forEach(abilityName => {
            const abilityEl = document.querySelector(`[data-ability="${abilityName}"]`);
            const cooldown = this.abilityCooldowns[abilityName] || 0;

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
            } else if (this.hero.hasActed || this.turnPhase !== 'hero') {
                abilityEl.classList.add('cooldown');
                let overlay = abilityEl.querySelector('.cooldown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'cooldown-overlay';
                    abilityEl.appendChild(overlay);
                }
                overlay.textContent = this.turnPhase !== 'hero' ? '⏳' : '✓';
            } else {
                const overlay = abilityEl.querySelector('.cooldown-overlay');
                if (overlay) overlay.remove();
            }
        });

        const endTurnBtn = document.getElementById('end-turn-btn');
        if (this.turnPhase !== 'hero') {
            endTurnBtn.style.background = 'linear-gradient(45deg, #636e72, #2d3436)';
            endTurnBtn.textContent = 'Processing...';
            endTurnBtn.disabled = true;
        } else if (this.hero.remainingMoves === 0 && this.hero.hasActed) {
            endTurnBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            endTurnBtn.textContent = 'Turn Complete';
            endTurnBtn.disabled = false;
        } else {
            endTurnBtn.style.background = 'linear-gradient(45deg, #00b894, #00cec9)';
            endTurnBtn.textContent = 'End Turn';
            endTurnBtn.disabled = false;
        }
    }

    updateModeDisplay() {
        const diceResult = document.getElementById('dice-result');
        let statusText = `${this.mode.charAt(0).toUpperCase() + this.mode.slice(1)} mode`;

        if (this.turnPhase !== 'hero') {
            statusText = 'Waiting for turn...';
        } else if (this.hero.remainingMoves === 0 && this.hero.hasActed) {
            statusText = 'Turn Complete!';
        } else if (this.hero.hasActed) {
            statusText = `Action used - Moves: ${this.hero.remainingMoves}`;
        } else if (this.hero.remainingMoves === 0) {
            statusText = 'Movement used - Can still act';
        }

        diceResult.textContent = statusText;

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        const hasMonsters = currentCard && currentCard.monsters.length > 0;

        document.getElementById('attack-btn').disabled = !hasMonsters || this.hero.hasActed || this.turnPhase !== 'hero';
        document.getElementById('move-btn').disabled = this.hero.remainingMoves === 0 || this.turnPhase !== 'hero';
    }

    calculateLevelGridLayout() {
        const layout = this.levelLayouts[this.currentLevel];

        // Find bounds of the level
        const minX = Math.min(...layout.map(pos => pos.x));
        const maxX = Math.max(...layout.map(pos => pos.x));
        const minY = Math.min(...layout.map(pos => pos.y));
        const maxY = Math.max(...layout.map(pos => pos.y));

        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;

        return {
            gridWidth,
            gridHeight,
            offsetX: -minX,
            offsetY: -minY
        };
    }

    renderMap() {
        const levelLayout = document.getElementById('level-layout');
        levelLayout.innerHTML = '';

        const { gridWidth, gridHeight, offsetX, offsetY } = this.calculateLevelGridLayout();

        // Set up CSS Grid
        levelLayout.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
        levelLayout.style.gridTemplateRows = `repeat(${gridHeight}, 1fr)`;

        // Create grid positions
        const gridPositions = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));

        // Place cards in their grid positions
        this.levelLayouts[this.currentLevel].forEach(cardPos => {
            const gridX = cardPos.x + offsetX;
            const gridY = cardPos.y + offsetY;
            gridPositions[gridY][gridX] = cardPos;
        });

        // Render the grid
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            for (let gridX = 0; gridX < gridWidth; gridX++) {
                const cardPos = gridPositions[gridY][gridX];

                if (cardPos) {
                    const cardContainer = this.createCardContainer(cardPos.x, cardPos.y);
                    levelLayout.appendChild(cardContainer);
                } else {
                    // Empty grid position
                    const emptyDiv = document.createElement('div');
                    levelLayout.appendChild(emptyDiv);
                }
            }
        }
    }

    createCardContainer(cardX, cardY) {
        const container = document.createElement('div');
        container.className = 'card-container';
        container.dataset.cardX = cardX;
        container.dataset.cardY = cardY;

        // Add coordinates label
        const coordLabel = document.createElement('div');
        coordLabel.className = 'card-coordinates';
        coordLabel.textContent = `(${cardX},${cardY})`;
        container.appendChild(coordLabel);

        const card = this.getCardAtPosition(cardX, cardY);

        if (!card) {
            // Unrevealed card
            container.classList.add('unrevealed');
            container.textContent = '❓';
            container.title = `Unexplored area (${cardX},${cardY})`;

            // Add click handler for unrevealed cards - only if hero is on edge and adjacent
            container.addEventListener('click', () => {
                if (this.turnPhase === 'hero') {
                    this.moveToCard(cardX, cardY);
                }
            });
        } else {
            // Revealed card
            container.classList.add('revealed');

            if (cardX === this.hero.cardX && cardY === this.hero.cardY) {
                container.classList.add('current');
            }

            // Create the card grid
            const cardGrid = document.createElement('div');
            cardGrid.className = 'card-grid';

            for (let y = 0; y < 7; y++) {
                for (let x = 0; x < 7; x++) {
                    const tile = document.createElement('div');
                    tile.className = 'card-tile';
                    tile.dataset.x = x;
                    tile.dataset.y = y;
                    tile.dataset.cardX = cardX;
                    tile.dataset.cardY = cardY;

                    // Only show details for current card
                    if (cardX === this.hero.cardX && cardY === this.hero.cardY) {
                        this.renderTile(tile, card, x, y, cardX, cardY);

                        // Add click handler for current card tiles (but not for hero/monster tiles - they have their own handlers)
                        const hasCharacter = (x === this.hero.x && y === this.hero.y) ||
                            card.monsters.some(m => m.x === x && m.y === y);
                        if (!hasCharacter) {
                            tile.addEventListener('click', () => {
                                if (cardX === this.hero.cardX && cardY === this.hero.cardY) {
                                    this.handleTileClick(x, y);
                                }
                            });
                        }
                    } else {
                        // Other revealed cards show basic layout but respect fog
                        this.renderTileBasic(tile, card, x, y, cardX, cardY);

                        // Add click handler to move to other cards
                        tile.addEventListener('click', () => {
                            if (this.turnPhase === 'hero') {
                                this.moveToCard(cardX, cardY);
                            }
                        });
                    }

                    cardGrid.appendChild(tile);
                }
            }

            container.appendChild(cardGrid);
        }

        return container;
    }

    renderTile(tile, card, x, y, cardX, cardY) {
        // Check fog of war
        const cardKey = `${cardX},${cardY}`;
        const fogSet = this.fogOfWar.get(cardKey);
        const posKey = `${x},${y}`;

        if (!fogSet || !fogSet.has(posKey)) {
            tile.classList.add('fog');
            return;
        }

        if (card.terrain[y][x] === 'wall') {
            tile.classList.add('wall');
            tile.textContent = '🧱';
        }

        // Add entities
        if (x === this.hero.x && y === this.hero.y) {
            tile.classList.add('hero');
            tile.textContent = '🦸';
            tile.title = `${this.hero.name} - Click to view character sheet`;
            tile.style.cursor = 'pointer';

            // Add special click handler for hero
            tile.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the normal tile click
                this.showCharacterSheet();
            });
        } else {
            const monster = card.monsters.find(m => m.x === x && m.y === y);
            if (monster) {
                tile.classList.add('monster');

                if (monster.engaged) {
                    tile.textContent = '👹';
                    tile.style.animation = 'monsterPulse 1.5s infinite';
                } else {
                    tile.textContent = '😴';
                    tile.style.animation = 'none';
                    tile.style.opacity = '0.7';
                }

                tile.title = `${monster.type} (HP: ${monster.hp}/${monster.maxHp}) ${monster.engaged ? 'ENGAGED' : 'sleeping'} - Click to view details`;
                tile.style.cursor = 'pointer';

                // Add special click handler for monsters
                tile.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the normal tile click

                    // Check if we're in combat mode first
                    if ((this.mode === 'attack' || this.mode === 'ability') && this.selectedAbility && this.turnPhase === 'hero' && !this.hero.hasActed) {
                        // Combat takes priority - perform attack
                        this.handleTileClick(x, y);
                    } else {
                        // Show character sheet when not in combat
                        this.showCharacterSheet(monster);
                    }
                });
            } else {
                const treasure = card.treasures.find(t => t.x === x && t.y === y && !t.collected);
                if (treasure) {
                    tile.classList.add('treasure');
                    tile.textContent = '💎';
                }
            }
        }

        // Highlight threat zones
        if (this.isAdjacentToEnemy(x, y, cardX, cardY) &&
            !(x === this.hero.x && y === this.hero.y) &&
            card.terrain[y][x] !== 'wall') {
            tile.style.boxShadow = '0 0 4px rgba(231, 76, 60, 0.4)';
        }
    }

    renderTileBasic(tile, card, x, y, cardX, cardY) {
        // Check fog of war for this card
        const cardKey = `${cardX},${cardY}`;
        const fogSet = this.fogOfWar.get(cardKey);
        const posKey = `${x},${y}`;

        if (!fogSet || !fogSet.has(posKey)) {
            tile.classList.add('fog');
            return;
        }

        // Show basic layout for revealed tiles only
        if (card.terrain[y][x] === 'wall') {
            tile.classList.add('wall');
            tile.textContent = '🧱';
        } else {
            const monster = card.monsters.find(m => m.x === x && m.y === y);
            if (monster) {
                tile.classList.add('monster');
                tile.textContent = '👹';
                tile.title = `${monster.type} (HP: ${monster.hp}/${monster.maxHp}) - Click to view details`;
                tile.style.cursor = 'pointer';

                // Add click handler for monsters in other cards
                tile.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the normal tile click
                    this.showCharacterSheet(monster);
                });
            } else if (card.treasures.some(t => t.x === x && t.y === y && !t.collected)) {
                tile.classList.add('treasure');
                tile.textContent = '💎';
            }
        }
    }

    moveToCard(targetCardX, targetCardY) {
        // Check if card is adjacent to current card
        const deltaX = Math.abs(targetCardX - this.hero.cardX);
        const deltaY = Math.abs(targetCardY - this.hero.cardY);

        if (deltaX + deltaY !== 1) {
            this.showMessage('You can only move to adjacent areas!');
            return;
        }

        if (this.hero.remainingMoves === 0) {
            this.showMessage('No movement points remaining!');
            return;
        }

        // Check if hero is on edge tile that allows transition
        if (!this.isHeroOnEdge()) {
            this.showMessage('You must be on the edge of the current area to move to adjacent areas!');
            return;
        }

        // Check if hero is on the correct edge for the transition
        const { x: heroX, y: heroY } = this.hero;
        let canTransition = false;

        if (targetCardX > this.hero.cardX && heroX === 6) canTransition = true; // Moving east from east edge
        if (targetCardX < this.hero.cardX && heroX === 0) canTransition = true; // Moving west from west edge
        if (targetCardY > this.hero.cardY && heroY === 6) canTransition = true; // Moving south from south edge
        if (targetCardY < this.hero.cardY && heroY === 0) canTransition = true; // Moving north from north edge

        if (!canTransition) {
            this.showMessage('You must be on the correct edge to move in that direction!');
            return;
        }

        // Place card if not already placed
        this.placeCard(targetCardX, targetCardY);

        // Find entry point for new card (opposite edge)
        let entryX = heroX, entryY = heroY;

        if (targetCardX > this.hero.cardX) entryX = 0; // Entering from west
        if (targetCardX < this.hero.cardX) entryX = 6; // Entering from east
        if (targetCardY > this.hero.cardY) entryY = 0; // Entering from north
        if (targetCardY < this.hero.cardY) entryY = 6; // Entering from south

        const newCard = this.getCardAtPosition(targetCardX, targetCardY);

        // Check if entry point is valid
        if (newCard.terrain[entryY][entryX] === 'wall' ||
            newCard.monsters.some(m => m.x === entryX && m.y === entryY)) {
            this.showMessage('Cannot enter that area - path blocked!');
            return;
        }

        // Move hero
        this.hero.cardX = targetCardX;
        this.hero.cardY = targetCardY;
        this.hero.x = entryX;
        this.hero.y = entryY;
        this.hero.remainingMoves = Math.max(0, this.hero.remainingMoves - 1);

        // Clear highlights when moving to new card
        this.clearAllHighlights();

        this.updateVisibility();
        this.updateMonsterEngagement();
        this.checkTurnComplete();
        this.renderMap();

        this.showMessage(`Entered area (${targetCardX},${targetCardY})!`);
    }
}