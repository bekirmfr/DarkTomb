class Game {
    constructor() {
        // Game constants
        this.GRID_SIZE = 7;
        this.VISION_RADIUS = 2;
        this.BASE_ENGAGEMENT_RANGE = 2;
        this.MAX_ENVIRONMENT_COOLDOWN = 5;
        this.MOVEMENT_ADJACENCY_PENALTY = 2;

        // Enhanced responsive system
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            updateCallback: null
        };

        // Dynamic zoom system with responsive levels
        this.zoomLevels = ['zoom-tiny', 'zoom-small', 'zoom-normal', 'zoom-large', 'zoom-huge', 'zoom-massive'];
        this.currentZoom = 2; // Start at normal
        this.zoomLabels = ['60%', '80%', '100%', '130%', '160%', '200%'];

        // Enhanced map navigation
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.mapPosition = { x: 0, y: 0 };
        this.touchStartDistance = 0;
        this.initialZoom = this.currentZoom;
        this.lastTouchTime = 0;

        // Enhanced responsive card sizing
        this.cardSizing = {
            maxWidth: 0,
            maxHeight: 0,
            optimalSize: 0,
            padding: 20,
            headerHeight: 60,
            bottomPanelHeight: 140
        };

        this.hero = {
            x: 3, y: 3,
            cardX: 0, cardY: 0,
            hp: 100, maxHp: 100,
            armor: 5, baseArmor: 5,
            move: 3, level: 1, xp: 0,
            bonusArmor: 0, bonusArmorTurns: 0,
            remainingMoves: 3,
            hasActed: false,
            name: "Kael Shadowbane",
            class: "Dungeon Explorer",
            background: "Once a noble knight, now explores the dark depths of Bloodthorn Island seeking ancient treasures and redemption."
        };

        this.currentLevel = 1;
        this.activeCards = new Map();
        this.cardDecks = {};
        this.levelLayouts = {};
        this.fogOfWar = new Map();

        this.selectedAbility = null;
        this.abilityCooldowns = {};
        this.environmentEffect = null;
        this.environmentTurns = 0;
        this.environmentCooldown = 0;
        this.turn = 1;
        this.turnPhase = 'hero';
        this.mode = 'move';

        this.abilities = {
            strike: {
                modifier: 2, damage: 8, range: 1, type: 'single', cooldown: 0,
                name: "Strike", description: "A precise melee attack that deals consistent damage to adjacent enemies."
            },
            fireball: {
                modifier: 4, damage: 12, range: 3, type: 'single', cooldown: 2,
                name: "Fireball", description: "Launch a blazing projectile that deals high damage at range. Requires line of sight."
            },
            heal: {
                modifier: 0, damage: -15, range: 0, type: 'self', cooldown: 3,
                name: "Heal", description: "Channel divine energy to restore your health and mend wounds."
            },
            charge: {
                modifier: 3, damage: 10, range: 2, type: 'charge', cooldown: 2,
                name: "Charge", description: "Rush forward to strike an enemy with tremendous force, combining movement and attack."
            },
            shield: {
                modifier: 0, damage: 0, range: 0, type: 'buff', cooldown: 4,
                name: "Shield", description: "Raise your defenses, gaining bonus armor that protects against incoming attacks."
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
        this.setupResponsiveSystem();
        this.initializeGame();
        this.bindEvents();
    }

    // Enhanced setupResponsiveSystem for better desktop experience
    setupResponsiveSystem() {
        // Calculate optimal card sizing based on viewport
        this.calculateOptimalCardSize();
        this.updateCSSCustomProperties();

        // Setup viewport resize handling with desktop optimizations
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleViewportResize();
            }, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportResize();
            }, 500);
        });

        // Enhanced touch prevention for desktop
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop) {
            // Prevent zoom on double tap for mobile/tablet only
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
        }

        // Setup viewport meta tag
        this.setupViewportMeta();

        // Setup CSS foundation
        this.setupCSSFoundation();

        // Add global error handling
        this.setupErrorHandling();
        
        // Add debug mode for development
        this.setupDebugMode();
    }

    // Enhanced calculateOptimalCardSize for better desktop experience
    calculateOptimalCardSize() {
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;

        const isDesktop = this.viewport.width >= 1024;
        const isLargeDesktop = this.viewport.width >= 1440;
        
        // Desktop-optimized calculations
        if (isLargeDesktop) {
            this.cardSizing.optimalSize = 480; // Large desktop
            this.cardSizing.padding = 60;
            this.cardSizing.headerHeight = 70;
            this.cardSizing.bottomPanelHeight = 150;
        } else if (isDesktop) {
            this.cardSizing.optimalSize = 420; // Standard desktop
            this.cardSizing.padding = 50;
            this.cardSizing.headerHeight = 65;
            this.cardSizing.bottomPanelHeight = 145;
        } else {
            // Mobile/tablet calculations (existing logic)
            const availableWidth = this.viewport.width - (this.cardSizing.padding * 2);
            const availableHeight = this.viewport.height -
                this.cardSizing.headerHeight -
                this.cardSizing.bottomPanelHeight -
                (this.cardSizing.padding * 2);

            const maxCardWidth = availableWidth * 0.85;
            const maxCardHeight = availableHeight * 0.85;

            this.cardSizing.optimalSize = Math.min(maxCardWidth, maxCardHeight);
            
            const minSize = 280;
            const maxSize = 380;
            this.cardSizing.optimalSize = Math.max(minSize, Math.min(maxSize, this.cardSizing.optimalSize));
        }

        const tileSize = this.cardSizing.optimalSize / 7;
        const optimalTileFont = Math.max(10, Math.min(20, tileSize * 0.3));

        this.cardSizing.tileFont = optimalTileFont;
        this.cardSizing.maxWidth = this.viewport.width * 0.8;
        this.cardSizing.maxHeight = this.viewport.height * 0.8;
    }

    // Enhanced updateCSSCustomProperties with desktop optimizations
    updateCSSCustomProperties() {
        const root = document.documentElement;
        const isDesktop = window.innerWidth >= 1024;

        const cardGap = Math.max(12, this.cardSizing.optimalSize * 0.06);
        const mapPadding = Math.max(20, this.cardSizing.optimalSize * 0.1);

        root.style.setProperty('--card-size', `${this.cardSizing.optimalSize}px`);
        //root.style.setProperty('--card-gap', `${cardGap}px`);
        root.style.setProperty('--tile-font-size', `${this.cardSizing.tileFont}px`);
        root.style.setProperty('--map-padding', `${mapPadding}px`);

        // Enhanced zoom factors for desktop
        const baseScale = this.cardSizing.optimalSize / (isDesktop ? 420 : 350);
        const zoomFactors = {
            'zoom-tiny': 0.6 * baseScale,
            'zoom-small': 0.8 * baseScale,
            'zoom-normal': 1.0 * baseScale,
            'zoom-large': 1.3 * baseScale,
            'zoom-huge': 1.6 * baseScale,
            'zoom-massive': 2.0 * baseScale
        };

        Object.entries(zoomFactors).forEach(([className, scale]) => {
            root.style.setProperty(`--${className}-scale`, scale);
        });
        
        // Desktop-specific optimizations
        if (isDesktop) {
            root.style.setProperty('--header-height', `${this.cardSizing.headerHeight}px`);
            root.style.setProperty('--bottom-panel-height', `${this.cardSizing.bottomPanelHeight}px`);
        }
    }

    // Add debug mode for development
    setupDebugMode() {
        // Enable debug mode with URL parameter or console command
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'scroll' || window.DEBUG_SCROLL) {
            document.body.classList.add('debug-scroll');
            console.log('🔍 Debug mode enabled: Scroll areas are now visible');
            
            // Add debug info to window for console access
            window.gameDebug = {
                centerOnCurrentCard: () => this.centerOnCurrentCard(),
                centerOnHero: () => this.centerOnHero(),
                updateScrollableArea: () => this.updateScrollableArea(),
                logScrollInfo: () => {
                    const mapViewport = document.getElementById('map-viewport');
                    if (mapViewport) {
                        console.log('Current scroll info:', {
                            scrollLeft: mapViewport.scrollLeft,
                            scrollTop: mapViewport.scrollTop,
                            scrollWidth: mapViewport.scrollWidth,
                            scrollHeight: mapViewport.scrollHeight,
                            clientWidth: mapViewport.clientWidth,
                            clientHeight: mapViewport.clientHeight,
                            zoom: this.currentZoom,
                            zoomFactor: this.getZoomFactor()
                        });
                    }
                }
            };
        }
    }

    setupViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    setupCSSFoundation() {
        const root = document.documentElement;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        root.style.setProperty('--vh', `${vh * 0.01}px`);
        root.style.setProperty('--vw', `${vw * 0.01}px`);

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

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (this.showMessage) {
                this.showMessage('An error occurred. The game will continue, but you may want to refresh if issues persist.');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }

    // Enhanced handleViewportResize to fix scrolling on resize
    handleViewportResize() {
        this.calculateOptimalCardSize();
        this.updateCSSCustomProperties();
        
        // Update scrollable area after resize
        setTimeout(() => {
            this.updateScrollableArea();
            this.renderMap();
            this.updateTouchIndicators();
        }, 100);

        // Reset zoom if too high for new viewport
        if (this.currentZoom > 2 && this.viewport.width < 768) {
            this.currentZoom = 2;
            this.updateZoom();
        }
        
        // Re-center on current card if on desktop
        if (window.innerWidth >= 1024) {
            setTimeout(() => this.centerOnCurrentCard(), 300);
        }
    }

    initializeLevels() {
        this.levelLayouts = {
            1: [
                { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 },
                { x: 0, y: 1 }, { x: 0, y: -1 }
            ],
            2: [
                { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
                { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
                { x: 0, y: -1 }, { x: 1, y: -1 }
            ],
            3: [
                { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
                { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
                { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 2, y: -1 }, { x: 3, y: -1 },
                { x: 1, y: 2 }, { x: 2, y: 2 }
            ]
        };
        this.generateCardDecks();
    }

    generateCardDecks() {
        for (let level = 1; level <= 3; level++) {
            this.cardDecks[level] = [];
            const cardCount = this.levelLayouts[level].length;
            for (let i = 0; i < cardCount; i++) {
                this.cardDecks[level].push(this.generateCardTemplate(level));
            }
        }
    }

    generateCardTemplate(level) {
        const card = { terrain: [], monsters: [], treasures: [] };

        for (let y = 0; y < this.GRID_SIZE; y++) {
            card.terrain[y] = [];
            for (let x = 0; x < this.GRID_SIZE; x++) {
                card.terrain[y][x] = Math.random() < 0.12 ? 'wall' : 'floor';
            }
        }

        const monsterCount = Math.max(1, 2 + Math.floor(level / 2));
        const monsterTypes = [
            { name: 'Goblin', attackRange: 1 }, { name: 'Orc', attackRange: 1 },
            { name: 'Skeleton', attackRange: 2 }, { name: 'Spider', attackRange: 1 },
            { name: 'Wraith', attackRange: 2 }, { name: 'Troll', attackRange: 1 }
        ];

        for (let i = 0; i < monsterCount; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * this.GRID_SIZE);
                y = Math.floor(Math.random() * this.GRID_SIZE);
                attempts++;
            } while ((card.terrain[y][x] === 'wall' || card.monsters.some(m => m.x === x && m.y === y)) && attempts < 50);

            if (attempts < 50) {
                const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
                card.monsters.push({
                    x, y, hp: 20 + (level * 5), maxHp: 20 + (level * 5),
                    armor: 3 + Math.floor(level / 2), damage: 6 + level,
                    type: monsterType.name, attackRange: monsterType.attackRange,
                    engaged: false, cardX: null, cardY: null, unitType: 'enemy'
                });
            }
        }

        const treasureCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < treasureCount; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * this.GRID_SIZE);
                y = Math.floor(Math.random() * this.GRID_SIZE);
                attempts++;
            } while ((card.terrain[y][x] === 'wall' ||
                card.monsters.some(m => m.x === x && m.y === y) ||
                card.treasures.some(t => t.x === x && t.y === y)) && attempts < 50);

            if (attempts < 50) {
                card.treasures.push({ x, y, collected: false });
            }
        }

        return card;
    }

    rotateCard(card, rotation) {
        const rotated = { terrain: [], monsters: [], treasures: [] };

        for (let y = 0; y < this.GRID_SIZE; y++) {
            rotated.terrain[y] = [];
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const [newX, newY] = this.rotateCoordinates(x, y, rotation);
                rotated.terrain[y][x] = card.terrain[newY][newX];
            }
        }

        card.monsters.forEach(monster => {
            const [newX, newY] = this.rotateCoordinates(monster.x, monster.y, rotation);
            rotated.monsters.push({ ...monster, x: newX, y: newY });
        });

        card.treasures.forEach(treasure => {
            const [newX, newY] = this.rotateCoordinates(treasure.x, treasure.y, rotation);
            rotated.treasures.push({ ...treasure, x: newX, y: newY });
        });

        return rotated;
    }

    rotateCoordinates(x, y, rotation) {
        const center = Math.floor(this.GRID_SIZE / 2);
        const relX = x - center;
        const relY = y - center;

        let newRelX, newRelY;
        switch (rotation) {
            case 0: newRelX = relX; newRelY = relY; break;
            case 1: newRelX = -relY; newRelY = relX; break;
            case 2: newRelX = -relX; newRelY = -relY; break;
            case 3: newRelX = relY; newRelY = -relX; break;
            default: newRelX = relX; newRelY = relY;
        }

        return [newRelX + center, newRelY + center];
    }

    // Enhanced initializeGame with better positioning
    initializeGame() {
        this.activeCards.clear();
        this.fogOfWar.clear();
        this.placeCard(0, 0);

        const startingCard = this.activeCards.get('0,0');
        if (startingCard) {
            startingCard.terrain[3][3] = 'floor';
        }

        this.resetTurnActions();
        this.updateVisibility();
        this.updateMonsterEngagement();
        this.updateDisplay();
        
        // Enhanced rendering and positioning for desktop
        this.renderMap();
        
        // Auto-center after initial load
        setTimeout(() => {
            this.updateScrollableArea();
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop) {
                setTimeout(() => this.centerOnCurrentCard(), 300);
            }
        }, 200);
    }

    placeCard(cardX, cardY) {
        const cardKey = `${cardX},${cardY}`;
        if (this.activeCards.has(cardKey)) return;

        const levelLayout = this.levelLayouts[this.currentLevel];
        const cardExists = levelLayout.some(pos => pos.x === cardX && pos.y === cardY);
        if (!cardExists) return;

        const cardIndex = levelLayout.findIndex(pos => pos.x === cardX && pos.y === cardY);
        if (cardIndex === -1) return;

        const originalCard = this.cardDecks[this.currentLevel][cardIndex];
        const rotation = Math.floor(Math.random() * 4);
        const rotatedCard = this.rotateCard(originalCard, rotation);

        rotatedCard.monsters.forEach(monster => {
            monster.cardX = cardX;
            monster.cardY = cardY;
        });

        this.activeCards.set(cardKey, { ...rotatedCard, cardX, cardY, rotation });
        this.fogOfWar.set(cardKey, new Set());
        this.showMessage(`New area discovered! Card placed at (${cardX},${cardY})`);
    }

    getCardAtPosition(cardX, cardY) {
        if (cardX === undefined || cardY === undefined) {
            console.warn('getCardAtPosition called with undefined coordinates');
            return null;
        }
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
        const { cardX, cardY, x: heroX, y: heroY } = this.hero;

        const cardKey = `${cardX},${cardY}`;
        if (!this.fogOfWar.has(cardKey)) {
            this.fogOfWar.set(cardKey, new Set());
        }
        const fogSet = this.fogOfWar.get(cardKey);

        for (let dy = -this.VISION_RADIUS; dy <= this.VISION_RADIUS; dy++) {
            for (let dx = -this.VISION_RADIUS; dx <= this.VISION_RADIUS; dx++) {
                const x = heroX + dx;
                const y = heroY + dy;

                if (x >= 0 && x < this.GRID_SIZE && y >= 0 && y < this.GRID_SIZE) {
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance <= this.VISION_RADIUS) {
                        fogSet.add(`${x},${y}`);
                    }
                }
            }
        }
    }

    isHeroOnEdge() {
        const { x, y } = this.hero;
        return x === 0 || x === this.GRID_SIZE - 1 || y === 0 || y === this.GRID_SIZE - 1;
    }

    resetTurnActions() {
        this.hero.remainingMoves = this.hero.move;
        this.hero.hasActed = false;
        this.turnPhase = 'hero';
        this.clearAllHighlights();
        this.updateTurnDisplay();
    }

    updateTurnDisplay() {
        const turnElement = document.getElementById('turn-number');
        const phaseElement = document.getElementById('turn-phase');

        if (turnElement) turnElement.textContent = this.turn;
        if (phaseElement) {
            phaseElement.classList.remove('hero', 'enemy', 'environment');
            phaseElement.classList.add(this.turnPhase);

            switch (this.turnPhase) {
                case 'hero': phaseElement.textContent = 'Hero Phase'; break;
                case 'enemy': phaseElement.textContent = 'Enemy Phase'; break;
                case 'environment': phaseElement.textContent = 'Environment Phase'; break;
            }
        }
    }

    clearTileEventListeners() {
        document.querySelectorAll('.card-tile').forEach(tile => {
            const newTile = tile.cloneNode(true);
            tile.parentNode.replaceChild(newTile, tile);
        });
    }

    bindEvents() {
        this.setupMapNavigation();

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

        const moveBtn = document.getElementById('move-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => {
                if (this.hero.remainingMoves > 0 && this.turnPhase === 'hero') {
                    this.mode = 'move';
                    this.selectedAbility = null;
                    this.highlightMovementRange();
                    this.updateModeDisplay();
                    document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
                }
            });
        }

        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                if (!this.hero.hasActed && this.turnPhase === 'hero') {
                    this.mode = 'attack';
                    this.selectedAbility = 'strike';
                    this.highlightAbilityRange();
                    this.updateModeDisplay();
                    document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
                    const strikeAbility = document.querySelector(`[data-ability="strike"]`);
                    if (strikeAbility) strikeAbility.classList.add('selected');
                }
            });
        }

        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                if (this.turnPhase === 'hero') {
                    this.clearAllHighlights();
                    this.endHeroTurn();
                }
            });
        }

        const dice = document.getElementById('dice');
        if (dice) {
            dice.addEventListener('click', () => {
                this.rollDice();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (this.turnPhase !== 'hero') return;

            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    e.preventDefault(); this.tryMoveHero(0, -1); break;
                case 'ArrowDown': case 's': case 'S':
                    e.preventDefault(); this.tryMoveHero(0, 1); break;
                case 'ArrowLeft': case 'a': case 'A':
                    e.preventDefault(); this.tryMoveHero(-1, 0); break;
                case 'ArrowRight': case 'd': case 'D':
                    e.preventDefault(); this.tryMoveHero(1, 0); break;
                case ' ':
                    e.preventDefault(); this.endHeroTurn(); break;
                case 'c': case 'C':
                    e.preventDefault(); this.showCharacterSheet(); break;
                case 'Escape':
                    e.preventDefault();
                    this.clearAllHighlights();
                    this.mode = 'move';
                    this.selectedAbility = null;
                    document.querySelectorAll('.ability').forEach(a => a.classList.remove('selected'));
                    break;
                case '=': case '+':
                    e.preventDefault(); this.zoomIn(); break;
                case '-': case '_':
                    e.preventDefault(); this.zoomOut(); break;
                case '0':
                    e.preventDefault(); this.resetZoom(); break;
            }
        });

        const menuBtn = document.getElementById('controls-menu-btn');
        const menu = document.getElementById('controls-menu');

        if (menuBtn && menu) {
            menuBtn.addEventListener('click', () => {
                const isOpen = menu.classList.contains('open');
                if (isOpen) {
                    menu.classList.remove('open');
                    menuBtn.classList.remove('open');
                } else {
                    menu.classList.add('open');
                    menuBtn.classList.add('open');
                }
            });
        }

        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');
        const centerCurrentBtn = document.getElementById('center-current');
        const centerHeroBtn = document.getElementById('center-hero');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => this.resetZoom());
        if (centerCurrentBtn) centerCurrentBtn.addEventListener('click', () => this.centerOnCurrentCard());
        if (centerHeroBtn) centerHeroBtn.addEventListener('click', () => this.centerOnHero());

        this.updateTouchIndicators();
    }

    setupMapNavigation() {
        const mapViewport = document.getElementById('map-viewport');
        const mapContainer = document.querySelector('.map-container');

        if (!mapViewport || !mapContainer) return;

        // Enhanced mouse controls with better drag detection
        mapContainer.addEventListener('mousedown', (e) => this.startDrag(e), { passive: false });
        document.addEventListener('mousemove', (e) => this.handleDrag(e), { passive: false });
        document.addEventListener('mouseup', () => this.endDrag());
        mapContainer.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Enhanced touch controls with proper event handling
        mapContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        mapContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        mapContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        mapContainer.addEventListener('touchcancel', () => this.handleTouchEnd());

        // Prevent context menu and unwanted gestures
        mapContainer.addEventListener('contextmenu', (e) => {
            if (this.isDragging) e.preventDefault();
        });

        // Prevent iOS Safari gesture conflicts
        mapContainer.addEventListener('gesturestart', (e) => e.preventDefault());
        mapContainer.addEventListener('gesturechange', (e) => e.preventDefault());
        mapContainer.addEventListener('gestureend', (e) => e.preventDefault());

        // Prevent text selection during drag
        mapContainer.addEventListener('selectstart', (e) => {
            if (this.isDragging) e.preventDefault();
        });

        // Prevent drag on images/elements
        mapContainer.addEventListener('dragstart', (e) => e.preventDefault());
    }

    startDrag(e) {
        if (e.button !== 0) return; // Only left mouse button

        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;

        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.cursor = 'grabbing';
            mapContainer.style.userSelect = 'none';
        }

        e.preventDefault();
        e.stopPropagation();
    }

    handleDrag(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;

        // Only process if there's meaningful movement
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            this.scrollMap(deltaX, deltaY);
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
        }

        e.preventDefault();
        e.stopPropagation();
    }

    endDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.cursor = 'grab';
            mapContainer.style.userSelect = '';
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.touches.length === 1) {
            // Single touch - start drag
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStart.x = touch.clientX;
            this.dragStart.y = touch.clientY;

            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                mapContainer.style.cursor = 'grabbing';
            }
        } else if (e.touches.length === 2) {
            // Two finger pinch - start zoom
            this.isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            this.touchStartDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            this.initialZoom = this.currentZoom;

            this.pinchCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.touches.length === 1 && this.isDragging) {
            // Single touch drag
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.dragStart.x;
            const deltaY = touch.clientY - this.dragStart.y;

            // Only process if there's meaningful movement
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                this.scrollMap(deltaX, deltaY);
                this.dragStart.x = touch.clientX;
                this.dragStart.y = touch.clientY;
            }
        } else if (e.touches.length === 2) {
            // Pinch to zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (this.touchStartDistance > 0) {
                const zoomFactor = currentDistance / this.touchStartDistance;
                const newZoomIndex = Math.round(this.initialZoom + (zoomFactor - 1) * 3);
                const clampedZoom = Math.max(0, Math.min(this.zoomLevels.length - 1, newZoomIndex));

                if (clampedZoom !== this.currentZoom) {
                    this.currentZoom = clampedZoom;
                    this.updateZoom();
                }
            }
        }
    }

    handleTouchEnd(e) {
        this.isDragging = false;
        this.touchStartDistance = 0;

        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.cursor = 'grab';
        }

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        if (delta > 0 && this.currentZoom < this.zoomLevels.length - 1) {
            this.zoomIn();
        } else if (delta < 0 && this.currentZoom > 0) {
            this.zoomOut();
        }
    }

    // Enhanced scrollMap with better momentum and bounds
    scrollMap(deltaX, deltaY) {
        const mapViewport = document.getElementById('map-viewport');
        if (!mapViewport) return;

        // Calculate momentum factor based on zoom and device type
        const zoomFactor = this.getZoomFactor();
        const isDesktop = window.innerWidth >= 1024;
        const baseMomentum = isDesktop ? 1.2 : 1.0;
        const momentumFactor = baseMomentum * (1 + (this.currentZoom * 0.1));

        // Calculate new scroll positions with momentum
        const newScrollLeft = mapViewport.scrollLeft - (deltaX * momentumFactor);
        const newScrollTop = mapViewport.scrollTop - (deltaY * momentumFactor);

        // Get maximum scroll positions
        const maxScrollLeft = Math.max(0, mapViewport.scrollWidth - mapViewport.clientWidth);
        const maxScrollTop = Math.max(0, mapViewport.scrollHeight - mapViewport.clientHeight);

        // Apply scrolling with bounds checking
        mapViewport.scrollLeft = Math.max(0, Math.min(maxScrollLeft, newScrollLeft));
        mapViewport.scrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));
    }

    // Helper method to get current zoom factor
    getZoomFactor() {
        const zoomFactors = [0.6, 0.8, 1.0, 1.3, 1.6, 2.0];
        return zoomFactors[this.currentZoom] || 1.0;
    }

    zoomIn() {
        if (this.currentZoom < this.zoomLevels.length - 1) {
            this.currentZoom++;
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.currentZoom > 0) {
            this.currentZoom--;
            this.updateZoom();
        }
    }

    resetZoom() {
        this.currentZoom = 2;
        this.updateZoom();
    }

    // Enhanced updateZoom method to fix scrollable area
    updateZoom() {
        const levelLayout = document.getElementById('level-layout');
        const zoomLabel = document.getElementById('zoom-level');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');

        if (levelLayout) {
            // Remove all zoom classes
            this.zoomLevels.forEach(zoom => levelLayout.classList.remove(zoom));
            // Add current zoom class
            levelLayout.classList.add(this.zoomLevels[this.currentZoom]);
            
            // Force layout recalculation after zoom change
            setTimeout(() => {
                this.updateScrollableArea();
            }, 50);
        }

        if (zoomLabel) {
            zoomLabel.textContent = this.zoomLabels[this.currentZoom];
        }

        // Update button states
        if (zoomInBtn) {
            zoomInBtn.disabled = this.currentZoom >= this.zoomLevels.length - 1;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.currentZoom <= 0;
        }
    }

    // Enhanced updateScrollableArea method
    updateScrollableArea() {
        const mapViewport = document.getElementById('map-viewport');
        const levelLayout = document.getElementById('level-layout');
        
        if (!mapViewport || !levelLayout) return;

        // Get current zoom factor
        const zoomFactor = this.getZoomFactor();
        
        // Calculate the layout size based on current level
        const { gridWidth, gridHeight } = this.calculateLevelGridLayout();
        const cardSize = this.cardSizing ? this.cardSizing.optimalSize : 380;
        const cardGap = Math.max(12, cardSize * 0.05);
        
        // Calculate total layout dimensions with zoom
        const layoutWidth = (gridWidth * cardSize + (gridWidth - 1) * cardGap) * zoomFactor;
        const layoutHeight = (gridHeight * cardSize + (gridHeight - 1) * cardGap) * zoomFactor;
        
        // Ensure viewport can scroll in all directions - increase multiplier for desktop
        const isDesktop = window.innerWidth >= 1024;
        const multiplier = isDesktop ? 3 : 2;
        
        const minWidth = mapViewport.clientWidth * multiplier;
        const minHeight = mapViewport.clientHeight * multiplier;
        
        const finalWidth = Math.max(layoutWidth, minWidth);
        const finalHeight = Math.max(layoutHeight, minHeight);
        
        // Apply size to enable proper scrolling
        levelLayout.style.minWidth = `${finalWidth}px`;
        levelLayout.style.minHeight = `${finalHeight}px`;
        
        // Ensure the layout is properly centered within the scrollable area
        levelLayout.style.margin = `${finalHeight * 0.4}px ${finalWidth * 0.4}px`;
        
        console.log('Enhanced scrollable area updated:', {
            zoomFactor,
            layoutWidth,
            layoutHeight,
            finalWidth,
            finalHeight,
            isDesktop,
            viewportWidth: mapViewport.clientWidth,
            viewportHeight: mapViewport.clientHeight
        });
    }

    // Enhanced centerOnCurrentCard method
    centerOnCurrentCard() {
        const currentCard = document.querySelector('.card-container.current');
        const mapViewport = document.getElementById('map-viewport');
        
        if (currentCard && mapViewport) {
            // Get the card's position relative to the scrollable area
            const cardRect = currentCard.getBoundingClientRect();
            const viewportRect = mapViewport.getBoundingClientRect();
            
            // Calculate center position
            const cardCenterX = cardRect.left + cardRect.width / 2 - viewportRect.left;
            const cardCenterY = cardRect.top + cardRect.height / 2 - viewportRect.top;
            
            const viewportCenterX = mapViewport.clientWidth / 2;
            const viewportCenterY = mapViewport.clientHeight / 2;
            
            // Calculate scroll positions to center the card
            const scrollLeft = mapViewport.scrollLeft + cardCenterX - viewportCenterX;
            const scrollTop = mapViewport.scrollTop + cardCenterY - viewportCenterY;
            
            mapViewport.scrollTo({
                left: scrollLeft,
                top: scrollTop,
                behavior: 'smooth'
            });
            
            // Visual feedback
            currentCard.style.boxShadow = '0 0 30px rgba(52, 152, 219, 1)';
            setTimeout(() => {
                currentCard.style.boxShadow = '';
            }, 1500);
        }
    }

    centerOnHero() {
        const currentCard = document.querySelector('.card-container.current .card-grid');
        const heroTile = currentCard?.querySelector('.card-tile.hero');

        if (heroTile) {
            this.scrollToElement(heroTile, true);
        } else {
            this.centerOnCurrentCard();
        }
    }

    scrollToElement(element, isHeroTile = false) {
        const mapViewport = document.getElementById('map-viewport');
        if (!mapViewport || !element) return;

        const rect = element.getBoundingClientRect();
        const viewportRect = mapViewport.getBoundingClientRect();

        const elementCenterX = rect.left + rect.width / 2 - viewportRect.left;
        const elementCenterY = rect.top + rect.height / 2 - viewportRect.top;

        const viewportCenterX = mapViewport.clientWidth / 2;
        const viewportCenterY = mapViewport.clientHeight / 2;

        const scrollLeft = mapViewport.scrollLeft + elementCenterX - viewportCenterX;
        const scrollTop = mapViewport.scrollTop + elementCenterY - viewportCenterY;

        mapViewport.scrollTo({
            left: scrollLeft,
            top: scrollTop,
            behavior: 'smooth'
        });

        if (isHeroTile) {
            element.style.boxShadow = '0 0 20px rgba(52, 152, 219, 1)';
            setTimeout(() => {
                element.style.boxShadow = '';
            }, 1000);
        }
    }

    // Enhanced touch indicator visibility
    updateTouchIndicators() {
        const touchIndicators = document.getElementById('touch-indicators');
        if (!touchIndicators) return;

        const isDesktop = window.innerWidth >= 1024;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Hide on desktop unless it's specifically a touch-enabled desktop
        if (isDesktop && !isTouchDevice) {
            touchIndicators.style.display = 'none';
        } else {
            touchIndicators.style.display = 'block';
            if (window.innerWidth < 768) {
                touchIndicators.textContent = '📱 Pinch zoom • Drag pan';
            } else {
                touchIndicators.textContent = '📱 Pinch to zoom • Drag to pan';
            }
        }
    }

    // Add method to test scrolling functionality
    testScrollDirection() {
        const mapViewport = document.getElementById('map-viewport');
        if (!mapViewport) {
            console.log('❌ Map viewport not found');
            return;
        }
        
        const initialLeft = mapViewport.scrollLeft;
        const initialTop = mapViewport.scrollTop;
        
        console.log('🧪 Testing scroll functionality...');
        console.log('📍 Initial position:', { left: initialLeft, top: initialTop });
        console.log('📐 Viewport dimensions:', {
            clientWidth: mapViewport.clientWidth,
            clientHeight: mapViewport.clientHeight,
            scrollWidth: mapViewport.scrollWidth,
            scrollHeight: mapViewport.scrollHeight,
            canScrollHorizontally: mapViewport.scrollWidth > mapViewport.clientWidth,
            canScrollVertically: mapViewport.scrollHeight > mapViewport.clientHeight
        });
        
        // Test all directions
        const tests = [
            { name: 'Left', deltaX: -100, deltaY: 0 },
            { name: 'Right', deltaX: 100, deltaY: 0 },
            { name: 'Up', deltaX: 0, deltaY: -100 },
            { name: 'Down', deltaX: 0, deltaY: 100 },
            { name: 'Diagonal', deltaX: 100, deltaY: 100 }
        ];
        
        let testIndex = 0;
        
        const runNextTest = () => {
            if (testIndex >= tests.length) {
                console.log('✅ Scroll test completed');
                mapViewport.scrollLeft = initialLeft;
                mapViewport.scrollTop = initialTop;
                return;
            }
            
            const test = tests[testIndex];
            console.log(`🔄 Testing ${test.name} scroll...`);
            
            const newLeft = Math.max(0, initialLeft + test.deltaX);
            const newTop = Math.max(0, initialTop + test.deltaY);
            
            mapViewport.scrollTo({ left: newLeft, top: newTop, behavior: 'smooth' });
            
            setTimeout(() => {
                const actualLeft = mapViewport.scrollLeft;
                const actualTop = mapViewport.scrollTop;
                const success = Math.abs(actualLeft - newLeft) < 10 && Math.abs(actualTop - newTop) < 10;
                
                console.log(`${success ? '✅' : '❌'} ${test.name}:`, {
                    expected: { left: newLeft, top: newTop },
                    actual: { left: actualLeft, top: actualTop }
                });
                
                testIndex++;
                setTimeout(runNextTest, 500);
            }, 500);
        };
        
        runNextTest();
    }

    tryMoveHero(deltaX, deltaY) {
        if (this.mode !== 'move' || this.hero.remainingMoves === 0) return;

        const newX = this.hero.x + deltaX;
        const newY = this.hero.y + deltaY;

        if (newX >= 0 && newX < this.GRID_SIZE && newY >= 0 && newY < this.GRID_SIZE) {
            this.moveHero(newX, newY);
        }
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
        const selectedAbility = document.querySelector(`[data-ability="${abilityName}"]`);
        if (selectedAbility) selectedAbility.classList.add('selected');
    }

    highlightMovementRange() {
        this.clearAllHighlights();

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        if (!currentCard) return;

        const { x: heroX, y: heroY } = this.hero;
        const reachableTiles = this.calculateReachableTiles(heroX, heroY, this.hero.remainingMoves, currentCard);

        reachableTiles.forEach(pos => {
            const cardContainer = document.querySelector(`.card-container.current .card-grid`);
            if (cardContainer) {
                const tileIndex = pos.y * this.GRID_SIZE + pos.x;
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

        if (this.environmentEffect && this.environmentEffect.name === 'Dark Fog' && ability.range > 0) {
            effectiveRange = Math.max(1, ability.range - 1);
        }

        if (ability.type === 'self' || ability.type === 'buff') {
            return;
        }

        const { x: heroX, y: heroY } = this.hero;
        const inRangeTiles = this.calculateAbilityRange(heroX, heroY, effectiveRange, currentCard);

        inRangeTiles.forEach(pos => {
            const cardContainer = document.querySelector(`.card-container.current .card-grid`);
            if (cardContainer) {
                const tileIndex = pos.y * this.GRID_SIZE + pos.x;
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
        const visited = new Map();
        const queue = [{ x: startX, y: startY, moves: maxMoves, path: [] }];

        while (queue.length > 0) {
            const { x, y, moves, path } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key) && visited.get(key) >= moves) continue;
            if (moves < 0) continue;

            visited.set(key, moves);

            if (!(x === startX && y === startY)) {
                reachable.push({ x, y, moves, path: [...path] });
            }

            if (moves > 0) {
                const neighbors = [
                    { x: x + 1, y: y }, { x: x - 1, y: y },
                    { x: x, y: y + 1 }, { x: x, y: y - 1 }
                ];

                neighbors.forEach(neighbor => {
                    if (neighbor.x >= 0 && neighbor.x < this.GRID_SIZE && neighbor.y >= 0 && neighbor.y < this.GRID_SIZE) {
                        if (card.terrain[neighbor.y][neighbor.x] !== 'wall' &&
                            !card.monsters.some(m => m.x === neighbor.x && m.y === neighbor.y)) {

                            let moveCost = 1;
                            const currentAdjacent = this.isAdjacentToEnemy(x, y, this.hero.cardX, this.hero.cardY);
                            const targetAdjacent = this.isAdjacentToEnemy(neighbor.x, neighbor.y, this.hero.cardX, this.hero.cardY);

                            if (!currentAdjacent && targetAdjacent) {
                                moveCost = this.MOVEMENT_ADJACENCY_PENALTY;
                            }

                            const newMoves = moves - moveCost;
                            const newPath = [...path, { x: neighbor.x, y: neighbor.y }];

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

        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const distance = Math.abs(x - centerX) + Math.abs(y - centerY);

                if (distance <= range && distance > 0) {
                    if (this.hasLineOfSight(centerX, centerY, x, y, card)) {
                        inRange.push({ x, y, distance });
                    }
                }
            }
        }

        return inRange;
    }

    hasLineOfSight(x1, y1, x2, y2, card) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            if (!(x === x1 && y === y1) && !(x === x2 && y === y2)) {
                if (card.terrain[y] && card.terrain[y][x] === 'wall') {
                    return false;
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
        if (x < 0 || x >= this.GRID_SIZE || y < 0 || y >= this.GRID_SIZE) {
            console.warn('handleTileClick called with invalid coordinates:', x, y);
            return;
        }

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
        if (x < 0 || x >= this.GRID_SIZE || y < 0 || y >= this.GRID_SIZE) {
            this.showMessage('Use card transitions to move between areas!');
            return;
        }

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        if (!currentCard) return;

        if (currentCard.terrain[y][x] === 'wall' ||
            currentCard.monsters.some(m => m.x === x && m.y === y)) {
            this.showMessage('That tile is blocked!');
            return;
        }

        const reachableTiles = this.calculateReachableTiles(this.hero.x, this.hero.y, this.hero.remainingMoves, currentCard);
        const targetTile = reachableTiles.find(tile => tile.x === x && tile.y === y);

        if (!targetTile) {
            this.showMessage('Cannot reach that tile with remaining movement!');
            return;
        }

        const movementCost = this.hero.remainingMoves - targetTile.moves;

        this.hero.remainingMoves -= movementCost;
        this.hero.x = x;
        this.hero.y = y;

        this.clearAllHighlights();

        this.updateVisibility();
        this.updateMonsterEngagement();

        if (this.environmentEffect && this.environmentEffect.name === 'Bloodthorn Growth') {
            this.takeDamage(this.hero, 1);
            this.showDamageNumber(x, y, 1, false);
        }

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

        const currentCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
        const inRangeTiles = this.calculateAbilityRange(this.hero.x, this.hero.y, effectiveRange, currentCard);
        const targetTile = inRangeTiles.find(tile => tile.x === x && tile.y === y);

        if (!targetTile) {
            this.showMessage('Target is out of range or blocked!');
            return;
        }

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
        if (!dice) return;

        dice.classList.add('rolling');

        let rollCount = 0;
        const rollInterval = setInterval(() => {
            const value = Math.floor(Math.random() * 20) + 1;
            dice.textContent = value;
            rollCount++;

            if (rollCount >= 10) {
                clearInterval(rollInterval);
                dice.classList.remove('rolling');

                if (value === 20 && this.environmentCooldown === 0) {
                    this.triggerEnvironmentalEffect();
                    this.environmentCooldown = this.MAX_ENVIRONMENT_COOLDOWN;
                }

                if (callback) callback(value);
            }
        }, 100);
    }

    attackTarget(target, ability) {
        const dice = document.getElementById('dice');
        if (!dice) return;

        const diceValue = parseInt(dice.textContent);
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
                if (currentCard) {
                    currentCard.monsters = currentCard.monsters.filter(m => m !== target);
                    this.gainXP(50);
                    this.checkWinCondition();
                }
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
        if (effectDiv) {
            effectDiv.textContent = `${this.environmentEffect.name}: ${this.environmentEffect.effect}`;
            effectDiv.style.display = 'block';
        }

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
        if (this.environmentEffect) {
            this.applyEnvironmentalEffects();
            this.environmentTurns--;
            if (this.environmentTurns <= 0) {
                this.environmentEffect = null;
                const effectDiv = document.getElementById('environment-effect');
                if (effectDiv) effectDiv.style.display = 'none';
            }
        }

        Object.keys(this.abilityCooldowns).forEach(ability => {
            if (this.abilityCooldowns[ability] > 0) {
                this.abilityCooldowns[ability]--;
            }
        });

        if (this.environmentCooldown > 0) {
            this.environmentCooldown--;
        }

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
                const heroCard = this.getCardAtPosition(this.hero.cardX, this.hero.cardY);
                if (heroCard && monster.cardX === this.hero.cardX && monster.cardY === this.hero.cardY) {
                    const distance = Math.abs(monster.x - this.hero.x) + Math.abs(monster.y - this.hero.y);
                    if (distance <= monster.attackRange + this.BASE_ENGAGEMENT_RANGE) {
                        monster.engaged = true;
                    }
                }
            });
        });
    }

    monsterAction(monster) {
        if (!monster.engaged) return;

        const heroDistance = this.getDistanceToHero(monster);

        if (monster.cardX !== this.hero.cardX || monster.cardY !== this.hero.cardY) {
            this.tryMonsterCardTransition(monster);
            return;
        }

        if (heroDistance <= monster.attackRange) {
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
            this.moveMonsterTowardsHero(monster);
        }
    }

    getDistanceToHero(monster) {
        if (monster.cardX !== this.hero.cardX || monster.cardY !== this.hero.cardY) {
            return Infinity;
        }
        return Math.abs(monster.x - this.hero.x) + Math.abs(monster.y - this.hero.y);
    }

    tryMonsterCardTransition(monster) {
        const isOnEdge = monster.x === 0 || monster.x === this.GRID_SIZE - 1 ||
            monster.y === 0 || monster.y === this.GRID_SIZE - 1;
        if (!isOnEdge) {
            this.moveMonsterTowardsCardEdge(monster);
            return;
        }

        const deltaCardX = this.hero.cardX - monster.cardX;
        const deltaCardY = this.hero.cardY - monster.cardY;

        if (Math.abs(deltaCardX) + Math.abs(deltaCardY) === 1) {
            let newCardX = monster.cardX;
            let newCardY = monster.cardY;
            let newX = monster.x;
            let newY = monster.y;

            if (deltaCardX > 0 && monster.x === this.GRID_SIZE - 1) {
                newCardX++;
                newX = 0;
            } else if (deltaCardX < 0 && monster.x === 0) {
                newCardX--;
                newX = this.GRID_SIZE - 1;
            } else if (deltaCardY > 0 && monster.y === this.GRID_SIZE - 1) {
                newCardY++;
                newY = 0;
            } else if (deltaCardY < 0 && monster.y === 0) {
                newCardY--;
                newY = this.GRID_SIZE - 1;
            }

            const levelLayout = this.levelLayouts[this.currentLevel];
            const cardExists = levelLayout.some(pos => pos.x === newCardX && pos.y === newCardY);

            if (!cardExists) {
                return;
            }

            const targetCard = this.getCardAtPosition(newCardX, newCardY);
            if (targetCard && targetCard.terrain[newY][newX] !== 'wall' &&
                !targetCard.monsters.some(m => m.x === newX && m.y === newY)) {

                const oldCard = this.getCardAtPosition(monster.cardX, monster.cardY);
                if (oldCard) {
                    oldCard.monsters = oldCard.monsters.filter(m => m !== monster);
                }

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

        if (deltaCardX > 0) targetX = Math.min(this.GRID_SIZE - 1, monster.x + 1);
        else if (deltaCardX < 0) targetX = Math.max(0, monster.x - 1);

        if (deltaCardY > 0) targetY = Math.min(this.GRID_SIZE - 1, monster.y + 1);
        else if (deltaCardY < 0) targetY = Math.max(0, monster.y - 1);

        const card = this.getCardAtPosition(monster.cardX, monster.cardY);
        if (card && card.terrain[targetY][targetX] !== 'wall' &&
            !card.monsters.some(m => m.x === targetX && m.y === targetY && m !== monster)) {
            monster.x = targetX;
            monster.y = targetY;
        }
    }

    moveMonsterTowardsHero(monster) {
        const card = this.getCardAtPosition(monster.cardX, monster.cardY);
        if (!card) return;

        let bestMove = { x: monster.x, y: monster.y };
        let bestDistance = this.getDistanceToHero(monster);

        const moves = [
            { x: monster.x + 1, y: monster.y },
            { x: monster.x - 1, y: monster.y },
            { x: monster.x, y: monster.y + 1 },
            { x: monster.x, y: monster.y - 1 }
        ];

        moves.forEach(move => {
            if (move.x >= 0 && move.x < this.GRID_SIZE && move.y >= 0 && move.y < this.GRID_SIZE &&
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
        const currentCardContainer = document.querySelector(`.card-container.current .card-grid`);
        if (!currentCardContainer) return;

        const tileIndex = y * this.GRID_SIZE + x;
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
        const character = unit || this.hero;

        const existingSheet = document.querySelector('.character-sheet');
        if (existingSheet) existingSheet.remove();

        const characterSheet = document.createElement('div');
        characterSheet.className = `character-sheet ${character.unitType || 'hero'}`;

        const content = document.createElement('div');
        content.className = 'character-sheet-content';

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

        const getUnitIcon = (unitType) => {
            switch (unitType) {
                case 'enemy': return '👹';
                case 'ally': return '🤝';
                default: return '🦸';
            }
        };

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
                <div class="character-class">${character.class || 'Monster'}</div>
                <div class="character-portrait">${getUnitIcon(character.unitType)}</div>
                <div style="font-size: 14px; color: #bbb; line-height: 1.4; margin-top: 10px;">
                    ${character.background || 'A dangerous creature that lurks in the shadows of Bloodthorn Island.'}
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
                `<div class="ability-card">
                            <div class="ability-header">
                                <div class="ability-title">Basic Combat</div>
                            </div>
                            <div class="ability-description">
                                This creature relies on basic melee attacks and natural instincts to defeat its enemies.
                            </div>
                            <div class="ability-stats">
                                <div class="ability-stat">
                                    <span style="color: #e17055;">💀</span>
                                    ${character.unitType === 'enemy' ? 'Hostile Entity' : 'Neutral Unit'}
                                </div>
                            </div>
                        </div>`
            }
                </div>
            </div>

            <button class="close-btn">
                Close ${character === this.hero ? 'Character Sheet' : 'Information'}
            </button>
        `;

        characterSheet.appendChild(content);
        document.body.appendChild(characterSheet);

        const closeBtn = content.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                characterSheet.remove();
            });
        }

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

        const messageContent = document.createElement('div');
        messageContent.textContent = text;

        const closeButton = document.createElement('button');
        closeButton.textContent = 'OK';
        closeButton.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #6c5ce7; border: none; border-radius: 4px; color: white; cursor: pointer;';
        closeButton.addEventListener('click', () => messageEl.remove());

        messageEl.appendChild(messageContent);
        messageEl.appendChild(closeButton);

        document.body.appendChild(messageEl);
        setTimeout(() => {
            if (messageEl.parentNode) messageEl.remove();
        }, 3000);
    }

    updateDisplay() {
        const elements = {
            'hero-hp': `${this.hero.hp}/${this.hero.maxHp}`,
            'hero-armor': this.hero.armor + this.hero.bonusArmor,
            'hero-move': `${this.hero.remainingMoves}/${this.hero.move}`,
            'hero-xp': this.hero.xp,
            'hero-level': this.hero.level,
            'current-card': `(${this.hero.cardX},${this.hero.cardY})`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        const xpProgress = (this.hero.xp / (this.hero.level * 100)) * 100;
        const xpProgressEl = document.getElementById('xp-progress');
        if (xpProgressEl) xpProgressEl.style.width = xpProgress + '%';

        Object.keys(this.abilities).forEach(abilityName => {
            const abilityEl = document.querySelector(`[data-ability="${abilityName}"]`);
            if (!abilityEl) return;

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
        if (endTurnBtn) {
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
    }

    updateModeDisplay() {
        const diceResult = document.getElementById('dice-result');
        if (!diceResult) return;

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

        const attackBtn = document.getElementById('attack-btn');
        const moveBtn = document.getElementById('move-btn');

        if (attackBtn) {
            attackBtn.disabled = !hasMonsters || this.hero.hasActed || this.turnPhase !== 'hero';
        }
        if (moveBtn) {
            moveBtn.disabled = this.hero.remainingMoves === 0 || this.turnPhase !== 'hero';
        }
    }

    calculateLevelGridLayout() {
        const layout = this.levelLayouts[this.currentLevel];

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

    // Enhanced renderMap with better initial positioning
    renderMap() {
        const levelLayout = document.getElementById('level-layout');
        if (!levelLayout) return;

        // Clear old event listeners before re-rendering
        this.clearTileEventListeners();

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

        // Update zoom and scrollable area after rendering
        this.updateZoom();
        
        // Ensure scrollable area is properly set up with a delay for layout calculation
        setTimeout(() => {
            this.updateScrollableArea();
            // Auto-center on current card after initial render
            if (this.turn === 1) {
                setTimeout(() => this.centerOnCurrentCard(), 500);
            }
        }, 100);
    }

    createCardContainer(cardX, cardY) {
        const container = document.createElement('div');
        container.className = 'card-container';
        container.dataset.cardX = cardX;
        container.dataset.cardY = cardY;

        const coordLabel = document.createElement('div');
        coordLabel.className = 'card-coordinates';
        coordLabel.textContent = `(${cardX},${cardY})`;
        container.appendChild(coordLabel);

        const card = this.getCardAtPosition(cardX, cardY);

        if (!card) {
            container.classList.add('unrevealed');
            container.textContent = '❓';
            container.title = `Unexplored area (${cardX},${cardY})`;

            container.addEventListener('click', () => {
                if (this.turnPhase === 'hero') {
                    this.moveToCard(cardX, cardY);
                }
            });
        } else {
            container.classList.add('revealed');

            if (cardX === this.hero.cardX && cardY === this.hero.cardY) {
                container.classList.add('current');
            }

            const cardGrid = document.createElement('div');
            cardGrid.className = 'card-grid';

            for (let y = 0; y < this.GRID_SIZE; y++) {
                for (let x = 0; x < this.GRID_SIZE; x++) {
                    const tile = document.createElement('div');
                    tile.className = 'card-tile';
                    tile.dataset.x = x;
                    tile.dataset.y = y;
                    tile.dataset.cardX = cardX;
                    tile.dataset.cardY = cardY;

                    if (cardX === this.hero.cardX && cardY === this.hero.cardY) {
                        this.renderTile(tile, card, x, y, cardX, cardY);

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
                        this.renderTileBasic(tile, card, x, y, cardX, cardY);

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

        if (x === this.hero.x && y === this.hero.y) {
            tile.classList.add('hero');
            tile.textContent = '🦸';
            tile.title = `${this.hero.name} - Click to view character sheet`;
            tile.style.cursor = 'pointer';

            tile.addEventListener('click', (e) => {
                e.stopPropagation();
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

                tile.addEventListener('click', (e) => {
                    e.stopPropagation();

                    if ((this.mode === 'attack' || this.mode === 'ability') && this.selectedAbility && this.turnPhase === 'hero' && !this.hero.hasActed) {
                        this.handleTileClick(x, y);
                    } else {
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

        if (this.isAdjacentToEnemy(x, y, cardX, cardY) &&
            !(x === this.hero.x && y === this.hero.y) &&
            card.terrain[y][x] !== 'wall') {
            tile.style.boxShadow = '0 0 4px rgba(231, 76, 60, 0.4)';
        }
    }

    renderTileBasic(tile, card, x, y, cardX, cardY) {
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
        } else {
            const monster = card.monsters.find(m => m.x === x && m.y === y);
            if (monster) {
                tile.classList.add('monster');
                tile.textContent = '👹';
                tile.title = `${monster.type} (HP: ${monster.hp}/${monster.maxHp}) - Click to view details`;
                tile.style.cursor = 'pointer';

                tile.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showCharacterSheet(monster);
                });
            } else if (card.treasures.some(t => t.x === x && t.y === y && !t.collected)) {
                tile.classList.add('treasure');
                tile.textContent = '💎';
            }
        }
    }

    moveToCard(targetCardX, targetCardY) {
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

        if (!this.isHeroOnEdge()) {
            this.showMessage('You must be on the edge of the current area to move to adjacent areas!');
            return;
        }

        const { x: heroX, y: heroY } = this.hero;
        let canTransition = false;

        if (targetCardX > this.hero.cardX && heroX === this.GRID_SIZE - 1) canTransition = true;
        if (targetCardX < this.hero.cardX && heroX === 0) canTransition = true;
        if (targetCardY > this.hero.cardY && heroY === this.GRID_SIZE - 1) canTransition = true;
        if (targetCardY < this.hero.cardY && heroY === 0) canTransition = true;

        if (!canTransition) {
            this.showMessage('You must be on the correct edge to move in that direction!');
            return;
        }

        this.placeCard(targetCardX, targetCardY);

        let entryX = heroX, entryY = heroY;

        if (targetCardX > this.hero.cardX) entryX = 0;
        if (targetCardX < this.hero.cardX) entryX = this.GRID_SIZE - 1;
        if (targetCardY > this.hero.cardY) entryY = 0;
        if (targetCardY < this.hero.cardY) entryY = this.GRID_SIZE - 1;

        const newCard = this.getCardAtPosition(targetCardX, targetCardY);
        if (!newCard) return;

        if (newCard.terrain[entryY][entryX] === 'wall' ||
            newCard.monsters.some(m => m.x === entryX && m.y === entryY)) {
            this.showMessage('Cannot enter that area - path blocked!');
            return;
        }

        this.hero.cardX = targetCardX;
        this.hero.cardY = targetCardY;
        this.hero.x = entryX;
        this.hero.y = entryY;
        this.hero.remainingMoves = Math.max(0, this.hero.remainingMoves - 1);

        this.clearAllHighlights();

        this.updateVisibility();
        this.updateMonsterEngagement();
        this.checkTurnComplete();
        this.renderMap();

        this.showMessage(`Entered area (${targetCardX},${targetCardY})!`);
    }
}