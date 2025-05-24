function createHero() {
    return {
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
}