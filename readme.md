# Dark Tomb: Bloodthorn Island

A strategic turn-based dungeon crawler featuring card-based exploration, tactical combat, and character progression. Explore the cursed Bloodthorn Island as Kael Shadowbane, a fallen knight seeking redemption in the depths of ancient dungeons.

![Game Preview](https://via.placeholder.com/800x400/2d1b5b/74b9ff?text=Dark+Tomb%3A+Bloodthorn+Island)

## 🎮 Features

### Core Gameplay
- **Turn-Based Combat**: Strategic combat with dice-based mechanics
- **Card-Based Exploration**: Dynamic 7x7 dungeon cards with procedural generation
- **Character Progression**: XP system, leveling, and stat improvements
- **Tactical Movement**: Grid-based movement with adjacency penalties
- **Environmental Effects**: Dynamic weather and hazards that affect gameplay

### Combat System
- **5 Unique Abilities**: Strike, Fireball, Heal, Charge, and Shield
- **Armor & Damage Reduction**: Strategic defense mechanics
- **Line of Sight**: Realistic targeting system
- **Monster AI**: Intelligent enemies that follow across cards

### Exploration
- **Fog of War**: Discover areas as you explore
- **Multiple Levels**: Progressively challenging dungeon layouts
- **Treasure Hunting**: Find valuable loot scattered throughout
- **Cross-Card Movement**: Seamless transition between dungeon areas

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional installations required

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Click "BEGIN YOUR QUEST" to start playing

### File Structure
```
dark-tomb/
├── index.html              # Main game page
├── css/
│   └── styles.css          # Game styles and animations
├── js/
│   ├── game.js            # Core game logic
│   └── main.js            # Game initialization
└── README.md              # This file
```

## 🎯 How to Play

### Basic Controls

#### Mouse Controls
- **Click tiles** to move or attack
- **Click abilities** to select them
- **Click cards** to move between areas
- **Click characters** to view stats
- **Drag map** to pan around large layouts
- **Mouse wheel** to zoom in/out
- **Map Controls menu** for zoom and navigation options

#### Touch Controls (Mobile/Tablet)
- **Tap tiles** to move or attack
- **Tap abilities** to select them
- **Drag map** to pan around
- **Pinch to zoom** in/out
- **Tap Map Controls** for navigation options

#### Keyboard Controls
- **WASD / Arrow Keys**: Move hero
- **Space**: End turn
- **C**: View character sheet
- **Escape**: Cancel current action
- **+ / =**: Zoom in map
- **- / _**: Zoom out map
- **0**: Reset zoom to 100%

### Game Flow

1. **Hero Phase**: Move and perform one action per turn
2. **Enemy Phase**: Monsters move and attack
3. **Environment Phase**: Apply effects and advance time

### Combat Mechanics

#### Abilities
- **Strike** (No cooldown): Basic melee attack (+2 bonus, 1 range)
- **Fireball** (2 turns): Ranged magic attack (+4 bonus, 3 range)
- **Heal** (3 turns): Restore 15 HP to yourself
- **Charge** (2 turns): Move and attack in one action (+3 bonus, 2 range)
- **Shield** (4 turns): Gain +2 armor for 3 turns

#### Dice System
- Roll d20 + ability modifier vs enemy armor
- Environmental effects can trigger on natural 20
- Critical hits and misses add tactical depth

### Movement Rules
- **3 movement points** per turn by default
- **Adjacency penalty**: Moving next to enemies costs extra movement
- **Edge transitions**: Move between cards from edges only
- **Blocked tiles**: Walls and monsters prevent movement

### Progression
- **Gain XP**: 10 per hit, 50 per kill, 25 per treasure
- **Level up**: Every 100 XP * current level
- **Stat increases**: +20 HP, +1 armor per level
- **New areas**: Unlock as you progress

## 🔧 Advanced Features

### Map Navigation System
Advanced navigation for exploring large dungeon layouts:
- **Single-card focus**: Cards sized for optimal individual viewing
- **Smooth panning**: Drag or scroll to navigate large maps
- **Intelligent centering**: Quick navigation to current card or hero
- **Touch gestures**: Pinch-to-zoom and drag on mobile devices
- **Collapsible controls**: Clean UI with expandable control menu
- **Auto-responsive sizing**: Cards automatically adjust to screen size

### Zoom System
Comprehensive zoom levels for detailed exploration:
- **60%**: Tiny view for full level overview
- **80%**: Small view for strategic planning
- **100%**: Standard view (default)
- **130%**: Large view for tactical detail
- **160%**: Huge view for precision gameplay
- **200%**: Massive view for fine control
- **Mouse wheel support**: Quick zoom with scroll wheel
- **Touch pinch support**: Natural mobile zoom gestures

### Environmental Effects
Triggered rarely (5% chance on natural 20 with cooldown):
- **Earthquake**: +1 damage to all attacks
- **Poison Mist**: 2 damage per turn to all units
- **Lightning Storm**: Random electrical damage
- **Bloodthorn Growth**: Movement costs HP
- **Dark Fog**: Reduces attack range

### Monster Types
- **Goblin**: Fast, weak melee fighter
- **Orc**: Strong melee brute
- **Skeleton**: Ranged undead archer
- **Spider**: Quick poisonous attacker
- **Wraith**: Ethereal ranged fighter
- **Troll**: Massive tank creature

### Level Layouts
- **Level 1**: 5 cards in cross pattern
- **Level 2**: 8 cards in rectangular grid
- **Level 3**: 14 cards in complex layout

## 🛠️ Technical Details

### Performance Optimizations
- Event listener cleanup to prevent memory leaks
- Smooth map panning with efficient scrolling
- Optimized zoom transforms with hardware acceleration
- Touch gesture handling with proper event management
- Efficient pathfinding algorithms
- Intelligent fog of war calculations

### Browser Compatibility
- **Chrome 80+**: Full support
- **Firefox 75+**: Full support
- **Safari 13+**: Full support
- **Edge 80+**: Full support

### Mobile Support
- Responsive design for tablets
- Touch-friendly interface
- Optimized performance for mobile devices

## 🎨 Customization

### Visual Themes
The game uses CSS custom properties for easy theming and sizing:
```css
:root {
  --primary-color: #6c5ce7;
  --secondary-color: #74b9ff;
  --danger-color: #e74c3c;
  --success-color: #00b894;
  --card-size: 320px;           /* Desktop card size (single-card focus) */
  --card-gap: 25px;             /* Gap between cards */
  --tile-font-size: 16px;       /* Tile font size */
  --map-padding: 50px;          /* Padding around map edges */
}
```

### Gameplay Modifications
Key constants in `game.js` can be adjusted:
```javascript
this.GRID_SIZE = 7;                    // Card size (7x7 grid)
this.VISION_RADIUS = 2;                // Fog of war range
this.MOVEMENT_ADJACENCY_PENALTY = 2;   // Movement cost near enemies

// Zoom system
this.zoomLevels = ['zoom-tiny', 'zoom-small', 'zoom-normal', 'zoom-large', 'zoom-huge', 'zoom-massive'];
this.currentZoom = 2;                  // Default zoom level (normal)
```

## 🐛 Troubleshooting

### Common Issues

**Game won't load**
- Check browser console for errors
- Ensure all files are in correct locations
- Try refreshing the page

**Performance issues**
- Close other browser tabs
- Update your browser
- Check for background applications

**Visual glitches**
- Disable browser extensions
- Try incognito/private mode
- Clear browser cache

### Error Messages
The game includes comprehensive error handling with helpful messages. If you encounter issues:
1. Check the browser console (F12)
2. Note any error messages
3. Try refreshing the page

## 🎯 Strategy Tips

### Combat
- Use **Strike** for consistent damage without cooldown
- Save **Fireball** for tough enemies or groups
- **Heal** when below 50% HP
- **Charge** combines movement and attack efficiently
- **Shield** before engaging multiple enemies

### Movement
- Plan your path to avoid adjacency penalties
- Use card edges strategically for retreat
- Clear areas systematically to avoid being surrounded
- Collect treasures for XP boosts

### Exploration
- Explore methodically to avoid surprises
- Use fog of war to your advantage
- Position yourself near exits when possible
- Manage your movement points carefully

## 📈 Future Enhancements

### Planned Features
- Save/load game functionality
- Multiple character classes
- Equipment and inventory system
- Sound effects and music
- Additional levels and monsters
- Multiplayer support

### Community Features
- Level editor for custom dungeons
- Achievement system
- Leaderboards
- Mod support

## 🤝 Contributing

We welcome contributions! Areas where help is appreciated:
- Bug reports and testing
- New monster types and abilities
- Level design and layouts
- Performance optimizations
- Documentation improvements

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by classic dungeon crawlers and tactical RPGs
- Built with modern web technologies
- Thanks to the gaming community for feedback and testing

---

**Enjoy your quest through Bloodthorn Island!** 🗡️⚔️🏰