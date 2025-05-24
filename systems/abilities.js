// Define all abilities used in the game
const ABILITIES = {
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