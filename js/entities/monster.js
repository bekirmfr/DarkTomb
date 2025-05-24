function generateMonsters(level, terrain) {
    const monsters = [];
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
            terrain[y][x] === 'wall' ||
            monsters.some(m => m.x === x && m.y === y)
        );

        const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        monsters.push({
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

    return monsters;
}