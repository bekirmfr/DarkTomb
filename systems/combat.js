// Combat-related functions

function rollDice(dice, callback) {
    dice.classList.add('rolling');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const value = Math.floor(Math.random() * 20) + 1;
        dice.textContent = value;
        rollCount++;

        if (rollCount >= 10) {
            clearInterval(rollInterval);
            dice.classList.remove('rolling');

            if (callback) callback(value);
        }
    }, 100);
}

function takeDamage(unit, damage, isHero = false) {
    if (isHero) {
        const effectiveArmor = unit.armor + unit.bonusArmor;
        const reducedDamage = Math.max(1, damage - Math.floor(effectiveArmor / 2));
        unit.hp -= reducedDamage;
        return reducedDamage;
    } else {
        unit.hp -= damage;
        if (unit.hp < 0) unit.hp = 0;
        return damage;
    }
}

function hasLineOfSight(x1, y1, x2, y2, terrain) {
    // Simple line of sight check using Bresenham's line algorithm
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
            if (terrain[y][x] === 'wall') {
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