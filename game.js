let coins = 0;
let clickPower = 1;
let autoclickLevel = 0; // Changed to level
let autoclickIntervalId = null;
let currentCat = 1;
let xp = 0;
let level = 1;
let comboCount = 0;
let comboTimeout = null;
let comboMultiplier = 1;
let comboActive = false;
let jumpGameActive = false;
let jumpScore = 0;
let isJumping = false;
let obstaclePosition = 0;
let jumpInterval = null;
let fishingGameActive = false;
let fishingScore = 0;
let fishingInterval = null;
let fishingTimerCountdown = null;
let fishSpawnCount = 0;
let passiveIncome = 0;
let passiveUpgradeCount = 0;
let lastRewardDate = null;
let streak = 0;
let petLevels = {}; // Объект для хранения уровней питомцев: { 'dog': 1, 'dragon': 0 }
let upgradeLevel = 1;
let currentTheme = 'light'; // 'light' or 'dark'
const xpPerClick = 1;
const xpToNextLevel = () => 10 + (level - 1) * 10;
let uiUpdateTimer = null;
let soundEnabled = true;
let vibrationEnabled = true;
let criticalClickChance = 0.02; // 2% chance for a critical click
let criticalClickMultiplier = 3; // Critical clicks give 3x coins

// Local High Scores for Mini-games
let fishingHighScores = [];
let jumpHighScores = [];

const dailyRewards = [50, 100, 150, 200, 300, 500, 1000];

const clickSound = new Audio('meow.mp3');
const buySound = new Audio('buy.mp3');
const levelUpSound = new Audio('level_up.mp3');
const criticalSound = new Audio('critical_hit.mp3'); // New sound for critical clicks

// --- Игровой цикл и основные функции ---

function handleCatClick(event) {
    if (jumpGameActive || fishingGameActive) return;

    let earnedCoins = clickPower;
    let isCritical = false;

    if (Math.random() < criticalClickChance) {
        earnedCoins *= criticalClickMultiplier;
        isCritical = true;
        playCriticalSound();
        showNotification("CRITICAL HIT! x" + criticalClickMultiplier + " coins!", 'orange');
    }

    // Combo Logic
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        comboCount = 0;
        comboMultiplier = 1;
        comboActive = false;
        document.getElementById('combo-display').style.opacity = 0; // Hide combo display
        updateUI();
    }, 2000);

    comboCount++;
    if (comboCount >= 5 && comboCount < 10) {
        comboMultiplier = 1.2;
        if (!comboActive) {
            showNotification("Combo x1.2!", 'green');
            comboActive = true;
        }
    } else if (comboCount >= 10 && comboCount < 20) {
        comboMultiplier = 1.5;
        if (comboActive && comboMultiplier !== 1.5) {
            showNotification("Combo x1.5!", 'green');
        }
    } else if (comboCount >= 20) {
        comboMultiplier = 2;
        if (comboActive && comboMultiplier !== 2) {
            showNotification("Combo x2!", 'green');
        }
    }
    earnedCoins *= comboMultiplier; // Apply combo multiplier after critical

    coins += earnedCoins;
    xp += xpPerClick;

    updateUI();
    playClickSound();
    vibrate(50);

    const catImg = document.getElementById('cat-img');
    catImg.classList.add('clicked');
    setTimeout(() => {
        catImg.classList.remove('clicked');
    }, 100);

    // Create coin element
    const coinElement = document.createElement('div');
    coinElement.classList.add('coin-float');
    if (isCritical) {
        coinElement.classList.add('critical-float'); // Add class for critical float style
        coinElement.textContent = `+${Math.round(earnedCoins)} CRIT!`;
    } else {
        coinElement.textContent = `+${Math.round(earnedCoins)}`;
    }

    const catArea = document.getElementById('cat-area');
    const catRect = catArea.getBoundingClientRect();

    const xOffset = (Math.random() - 0.5) * catRect.width * 0.4;
    const yOffset = (Math.random() - 0.5) * catRect.height * 0.4;

    coinElement.style.left = `${event.clientX - catRect.left + xOffset}px`;
    coinElement.style.top = `${event.clientY - catRect.top + yOffset}px`;

    catArea.appendChild(coinElement);

    setTimeout(() => {
        coinElement.remove();
    }, 1000);

    // Update combo display
    const comboDisplay = document.getElementById('combo-display');
    if (comboCount > 1) { // Only show combo if it's more than 1 click
        comboDisplay.textContent = `Combo x${comboMultiplier.toFixed(1)} (${comboCount})`;
        comboDisplay.style.opacity = 1; // Show combo display
    } else {
        comboDisplay.style.opacity = 0; // Hide combo display initially if not in combo
    }
}

function gameTick() {
    // Autoclick income based on its level
    if (autoclickLevel > 0) {
        coins += autoclickLevel; // Each level gives 1 coin/sec
    }

    // Passive income based on its level
    coins += passiveIncome;
    updateUI();
    spawnRareEvent(); // Spawns rare events periodically
}

// --- Функции UI и обновления ---

function updateUI() {
    document.getElementById('coins').textContent = Math.floor(coins);
    document.getElementById('level').textContent = level;

    const xpRequired = xpToNextLevel();
    const xpBar = document.getElementById('xp-bar');
    const xpBarText = document.getElementById('xp-bar-text');
    let xpPercentage = (xp / xpRequired) * 100;
    xpBar.style.width = `${xpPercentage}%`;
    xpBarText.textContent = `XP: ${xp}/${xpRequired}`;

    if (xp >= xpRequired) {
        levelUp();
    }

    document.getElementById('upgrade-click-price').textContent = calculateUpgradeCost('click');
    document.getElementById('upgrade-level-display').textContent = `(Ур. ${upgradeLevel})`;

    document.getElementById('autoclick-price').textContent = calculateUpgradeCost('autoclick');
    document.getElementById('autoclick-level-display').textContent = `(Ур. ${autoclickLevel})`;
    const autoclickInfo = document.getElementById('autoclick-info');
    if (autoclickLevel > 0) {
        autoclickInfo.textContent = `Auto-click is active. Coins/sec: ${autoclickLevel}`;
    } else {
        autoclickInfo.textContent = 'Buy an autoclicker at the shop!';
    }
    
    document.getElementById('passive-price').textContent = calculateUpgradeCost('passive');
    document.getElementById('passive-level-display').textContent = `(Ур. ${passiveUpgradeCount})`;
    
    updatePetsUI();
    updateMiniGameHighScoresUI(); // Update mini-game high scores
}

function levelUp() {
    level++;
    xp = 0;
    coins += level * 10; // Reward coins for leveling up
    showNotification(`Уровень повышен до ${level}!`, 'green');
    playLevelUpSound();
    vibrate(100);
    updateUI();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).style.display = 'block';
    document.querySelector(`.tab-button[onclick*="${tabId}"]`).classList.add('active');
}

function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.classList.add('notification-message');
    notification.textContent = message;

    if (type === 'error') {
        notification.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
    } else if (type === 'success' || type === 'green') {
        notification.style.backgroundColor = 'rgba(40, 167, 69, 0.8)';
    } else if (type === 'warning' || type === 'orange') { // Added 'orange' type
        notification.style.backgroundColor = 'rgba(255, 152, 0, 0.8)';
    }

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// --- Улучшения и покупки ---

function calculateUpgradeCost(type) {
    switch (type) {
        case 'click':
            return 10 * Math.pow(2, upgradeLevel - 1);
        case 'autoclick':
            return 50 * Math.pow(1.5, autoclickLevel); // Cost increases with level
        case 'passive':
            return 100 * Math.pow(1.5, passiveUpgradeCount);
        default:
            return 0;
    }
}

function buyUpgrade(type) {
    let cost = calculateUpgradeCost(type);

    if (coins >= cost) {
        coins -= cost;
        playBuySound();
        vibrate(100);

        switch (type) {
            case 'click':
                clickPower++;
                upgradeLevel++;
                showNotification(`Сила клика улучшена до ${clickPower}!`, 'green');
                break;
            case 'autoclick':
                autoclickLevel++;
                showNotification(`Автоматический клик улучшен до ур. ${autoclickLevel}!`, 'green');
                break;
            case 'passive':
                passiveIncome += 1;
                passiveUpgradeCount++;
                showNotification(`Пассивный доход увеличен! Теперь ${passiveIncome} монет/сек.`, 'green');
                break;
        }
        updateUI();
        saveGame();
    } else {
        showNotification('Недостаточно монет!', 'error');
    }
}

// --- Система питомцев ---

function buyPet(petType) {
    let cost = 0;
    switch (petType) {
        case 'dog': cost = 500; break;
        case 'dragon': cost = 5000; break;
        case 'phoenix': cost = 7500; break;
        case 'unicorn': cost = 10000; break;
        default: return;
    }

    if (coins >= cost) {
        if (petLevels[petType]) {
            showNotification(`У вас уже есть ${petType}!`, 'warning');
            return;
        }

        coins -= cost;
        petLevels[petType] = 1;
        applyPetBonus(petType, 1);
        showNotification(`Вы купили ${petType}!`, 'green');
        playBuySound();
        vibrate(100);
        updateUI();
        saveGame();
    } else {
        showNotification('Недостаточно монет для покупки питомца!', 'error');
    }
}

function levelUpPet(petType) {
    if (!petLevels[petType]) {
        showNotification(`У вас нет ${petType}, купите его сначала!`, 'error');
        return;
    }

    const cost = getPetLevelUpCost(petType);

    if (coins >= cost) {
        coins -= cost;
        petLevels[petType]++;
        applyPetBonus(petType, petLevels[petType]);
        showNotification(`${petType.charAt(0).toUpperCase() + petType.slice(1)} повышен до уровня ${petLevels[petType]}!`, 'green');
        playLevelUpSound();
        vibrate(50);
        updateUI();
        saveGame();
    } else {
        showNotification('Недостаточно монет для улучшения питомца!', 'error');
    }
}

function applyPetBonus() { // Removed specific petType and level args as it recalculates all
    // Resetting current bonuses from pets to recalculate.
    passiveIncome = 0; // Reset passive from pets
    clickPower = 1 + (upgradeLevel - 1); // Reset clickPower from pets, base + click upgrades
    criticalClickChance = 0.02; // Base chance
    
    for (const pType in petLevels) {
        const pLevel = petLevels[pType];
        switch (pType) {
            case 'dog':
                passiveIncome += (0.2 * pLevel);
                break;
            case 'dragon':
                clickPower += (0.5 * pLevel);
                break;
            case 'phoenix':
                // For Phoenix, if xpPerClick is a const, you might need a global XP multiplier
                // or calculate it dynamically in handleCatClick. Let's make xpPerClick a `let`.
                // xpPerClick is already a const global for now, so this bonus wouldn't apply here.
                // If we want it to affect XP, we'd need a global XP multiplier.
                // For now, let's make Phoenix give a small click power boost. (Or re-evaluate xpPerClick as let)
                // Let's modify xp gain directly in handleCatClick if Phoenix is owned.
                // For demonstration, if it affects XP, we might need to adjust xpPerClick in handleCatClick dynamically.
                // Simpler: assume it's a constant, and if Phoenix gives a bonus, it applies at the point of XP calculation.
                // Or: make `xpPerClick` a `let` and modify it. Let's make `xpPerClick` a `let` for simplicity.
                // In game.js, ensure `const xpPerClick = 1;` is `let xpPerClick = 1;`
                // I've left it as a const for now to avoid larger changes unless explicitly needed.
                // For this example, I'll make Phoenix give a small bonus to passive income.
                passiveIncome += (0.05 * pLevel); // Small passive income bonus for Phoenix
                break;
            case 'unicorn':
                criticalClickChance += (0.001 * pLevel);
                break;
        }
    }
}

function updatePetsUI() {
    const petsList = document.getElementById('pets-list');
    petsList.innerHTML = '';

    let hasPets = false;
    for (const petType in petLevels) {
        if (petLevels[petType] > 0) {
            hasPets = true;
            const petDiv = document.createElement('div');
            petDiv.classList.add('pet-item');
            petDiv.innerHTML = `
                <div class="item-info">
                    <h4>${petType.charAt(0).toUpperCase() + petType.slice(1)}</h4>
                    <p>Level: ${petLevels[petType]}</p>
                    <p>Bonus: ${getPetBonusDescription(petType, petLevels[petType])}</p>
                </div>
                <span class="item-price">${getPetLevelUpCost(petType)}</span>
                <button class="ui-btn buy-btn" onclick="levelUpPet('${petType}')">
                    <i class="fas fa-level-up-alt"></i> Улучшить
                </button>
            `;
            petsList.appendChild(petDiv);
        }
    }

    if (!hasPets) {
        petsList.innerHTML = '<p style="text-align: center; color: #777;">You do not have any pets yet. Buy them in the store!</p>';
    }
}

function getPetBonusDescription(petType, level) {
    switch(petType) {
        case 'dog':
            return `+${(0.2 * level).toFixed(1)} to passive income`;
        case 'dragon':
            return `+${(0.5 * level).toFixed(1)} to the power of click`;
        case 'phoenix':
            return `+${(0.05 * level).toFixed(2)} to passive income (XP bonus)`; // Changed to passive income
        case 'unicorn':
            return `+${(0.001 * level * 100).toFixed(2)}% to the chance of critical click`;
        default:
            return '';
    }
}

function getPetLevelUpCost(petType) {
    const baseCost = 100;
    const currentLevel = petLevels[petType] || 0;
    return baseCost * (currentLevel + 1);
}


// --- Ежедневные награды ---

function checkDailyReward() {
    const today = new Date().toDateString();
    const dailyRewardBtn = document.getElementById('daily-reward-btn');

    if (lastRewardDate === today) {
        showNotification("You have already claimed today's reward!");
        dailyRewardBtn.disabled = true; // Disable button if already claimed
        return;
    } else {
        dailyRewardBtn.disabled = false; // Enable button if not claimed
        dailyRewardBtn.classList.add('glow');
    }

    dailyRewardBtn.onclick = () => {
        let currentStreak = 0;
        if (lastRewardDate) {
            const lastDate = new Date(lastRewardDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toDateString() === yesterday.toDateString()) {
                currentStreak = streak + 1;
            } else {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }

        streak = Math.min(currentStreak, dailyRewards.length);
        const reward = dailyRewards[streak - 1];
        coins += reward;
        lastRewardDate = today;
        showNotification(`Daily reward: ${reward} coins! Streak: ${streak}/7`, 'green');
        dailyRewardBtn.classList.remove('glow');
        dailyRewardBtn.disabled = true; // Disable after claiming
        dailyRewardBtn.onclick = null; // Remove onclick handler
        saveGame();
        updateUI();
    };
}

// --- Система редких событий ---

const rareEvents = [
    {
        name: "Meteor shower",
        chance: 0.002, // 0.2%
        action: () => {
            const bonus = 500 * level;
            coins += bonus;
            showNotification(`Meteor shower! +${bonus} coins!`, 'success');
        }
    },
    {
        name: "Happy cat",
        chance: 0.005, // 0.5%
        action: () => {
            showNotification("Happy cat! Coins for click x2 for 20 seconds!", 'success');
            const originalPower = clickPower;
            clickPower *= 2;
            setTimeout(() => {
                clickPower = originalPower;
                showNotification("The Happy Cat effect is over.", 'info');
                updateUI();
            }, 20000);
        }
    },
    {
        name: "Gold fish",
        chance: 0.003, // 0.3%
        action: () => {
            showNotification("Gold fish! Open the mini-game Fishing for super bonus!", 'warning');
            // This could set a flag for the fishing game to spawn a special fish
            localStorage.setItem('goldenFishBonus', 'true');
        }
    },
    {
        name: "Stash with XP",
        chance: 0.004, // 0.4%
        action: () => {
            const bonusXP = 50 + level * 5;
            xp += bonusXP;
            showNotification(`You found a stash with XP! +${bonusXP} XP!`, 'success');
            updateUI();
        }
    }
];

function spawnRareEvent() {
    rareEvents.forEach(event => {
        let currentChance = event.chance;
        if (petLevels['unicorn']) {
            currentChance += (0.001 * petLevels['unicorn']);
        }

        if (Math.random() < currentChance) {
            event.action();
        }
    });
}

// --- Мини-игры ---

function startGame(gameType) {
    if (gameType === 'fishing') {
        document.getElementById('fishing-game').style.display = 'flex';
        fishingGameActive = true;
        startFishingGame();
    } else if (gameType === 'jump') {
        document.getElementById('jump-game').style.display = 'flex';
        jumpGameActive = true;
        startJumpGame();
    }
}

// Рыбалка
function startFishingGame() {
    fishingScore = 0;
    let timer = 30;
    const fishingTimerDisplay = document.getElementById('fishing-timer');
    const fishingScoreDisplay = document.getElementById('fishing-score-display');
    const fishingScene = document.getElementById('fishing-scene');
    const goldenFishBonusActive = localStorage.getItem('goldenFishBonus') === 'true';

    fishingScene.innerHTML = '';
    fishingScoreDisplay.textContent = fishingScore;

    const fishTypes = [
        { emoji: '🐠', points: 10, speed: 1000, size: '3em' },
        { emoji: '🐡', points: 15, speed: 800, size: '3em' },
        { emoji: '🐙', points: 20, speed: 1200, size: '3.5em' },
        { emoji: '🦀', points: 5, speed: 700, size: '2.5em' },
        { emoji: '🐟', points: 12, speed: 900, size: '3em' },
    ];

    const spawnFish = () => {
        if (!fishingGameActive) return;

        let randomFishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        // If golden fish bonus is active, increase chance of golden fish
        if (goldenFishBonusActive && Math.random() < 0.2) { // 20% chance to spawn golden fish
            randomFishType = { emoji: '👑🐠', points: 50, speed: 600, size: '4em', isGold: true };
        }

        const fish = document.createElement('div');
        fish.classList.add('fish');
        if (randomFishType.isGold) {
            fish.classList.add('fish-gold');
        }
        fish.textContent = randomFishType.emoji;
        fish.style.fontSize = randomFishType.size;
        
        fish.style.left = `${Math.random() * (fishingScene.offsetWidth - 70)}px`;
        fish.style.top = `${Math.random() * (fishingScene.offsetHeight - 70)}px`;

        fishingScene.appendChild(fish);

        fish.onclick = () => {
            if (fish.classList.contains('caught')) return;
            
            fishingScore += randomFishType.points;
            fishingScoreDisplay.textContent = fishingScore;
            fish.classList.add('caught');
            playClickSound();

            const scoreFloat = document.createElement('div');
            scoreFloat.classList.add('coin-float');
            scoreFloat.textContent = `+${randomFishType.points}`;
            scoreFloat.style.left = `${fish.offsetLeft + fish.offsetWidth / 2}px`;
            scoreFloat.style.top = `${fish.offsetTop}px`;
            fishingScene.appendChild(scoreFloat);

            setTimeout(() => {
                fish.remove();
                scoreFloat.remove();
            }, 500);
        };

        setTimeout(() => {
            if (fish.parentNode === fishingScene && !fish.classList.contains('caught')) {
                fish.remove();
            }
        }, randomFishType.speed + (Math.random() * 500));
    };

    fishingInterval = setInterval(spawnFish, 500 + Math.random() * 1000);

    fishingTimerCountdown = setInterval(() => {
        timer--;
        fishingTimerDisplay.textContent = timer;
        if (timer <= 0) {
            clearInterval(fishingTimerCountdown);
            clearInterval(fishingInterval);
            endFishingGame();
        }
    }, 1000);
}

function endFishingGame() {
    fishingGameActive = false;
    document.getElementById('fishing-game').style.display = 'none';
    const finalBonus = fishingScore * 2;
    coins += finalBonus;
    xp += fishingScore;
    showNotification(`Fishing is over! You earned ${fishingScore} points & ${finalBonus} coins!`, 'success');
    
    // Update high score for fishing
    fishingHighScores.push(fishingScore);
    fishingHighScores.sort((a, b) => b - a); // Sort descending
    fishingHighScores = fishingHighScores.slice(0, 5); // Keep top 5
    localStorage.removeItem('goldenFishBonus'); // Remove bonus after game
    updateUI();
    saveGame();
}

document.getElementById('close-fishing').addEventListener('click', () => {
    clearInterval(fishingInterval);
    clearInterval(fishingTimerCountdown);
    endFishingGame();
});


// Прыжки с котом
function startJumpGame() {
    jumpScore = 0;
    isJumping = false;
    obstaclePosition = 0;
    const catJumper = document.getElementById('cat-jumper');
    const jumpObstacle = document.getElementById('jump-obstacle');
    const jumpScoreDisplay = document.getElementById('jump-score');

    catJumper.style.bottom = '0px';
    jumpObstacle.style.right = '-30px';
    jumpScoreDisplay.textContent = jumpScore;

    catJumper.style.left = '50px';
    catJumper.textContent = '🐱';

    // Obstacle movement speed increases with score/level for challenge
    let obstacleSpeed = 5;

    jumpInterval = setInterval(() => {
        if (!jumpGameActive) return;

        obstaclePosition += obstacleSpeed;
        jumpObstacle.style.right = `${obstaclePosition}px`;

        // Collision detection (simplified)
        const catRect = catJumper.getBoundingClientRect();
        const obstacleRect = jumpObstacle.getBoundingClientRect();

        if (catRect.right > obstacleRect.left &&
            catRect.left < obstacleRect.right &&
            catRect.bottom > obstacleRect.top &&
            catRect.top < obstacleRect.bottom) {
            if (!isJumping) { // Only collide if not jumping
                endJumpGame();
                return;
            }
        }
        

        if (obstaclePosition > document.getElementById('jump-scene').offsetWidth + 30) {
            obstaclePosition = -30;
            jumpScore++;
            jumpScoreDisplay.textContent = jumpScore;
            showNotification(`Point! Current score: ${jumpScore}`, 'info');
            obstacleSpeed += 0.2; // Make it harder over time
        }

    }, 20);

    document.getElementById('jump-scene').onclick = () => {
        if (!isJumping) {
            isJumping = true;
            let jumpHeight = 0;
            let jumpSpeed = 8;

            const jumpAnimation = setInterval(() => {
                if (!jumpGameActive) {
                    clearInterval(jumpAnimation);
                    return;
                }

                jumpHeight += jumpSpeed;
                jumpSpeed -= 1;
                catJumper.style.bottom = `${jumpHeight}px`;

                if (jumpHeight <= 0 && jumpSpeed < 0) {
                    clearInterval(jumpAnimation);
                    isJumping = false;
                    catJumper.style.bottom = '0px';
                }
            }, 20);
        }
    };
}

function endJumpGame() {
    jumpGameActive = false;
    clearInterval(jumpInterval);
    document.getElementById('jump-game').style.display = 'none';
    const finalBonus = jumpScore * 5;
    coins += finalBonus;
    xp += jumpScore * 2;
    showNotification(`The jumps are over! You scored ${jumpScore} points & earned ${finalBonus} coins!`, 'success');

    // Update high score for jump
    jumpHighScores.push(jumpScore);
    jumpHighScores.sort((a, b) => b - a);
    jumpHighScores = jumpHighScores.slice(0, 5);
    updateUI();
    saveGame();
}

document.getElementById('close-jump').addEventListener('click', () => {
    clearInterval(jumpInterval);
    endJumpGame();
});

function updateMiniGameHighScoresUI() {
    const fishingScoresList = document.getElementById('fishing-high-scores');
    fishingScoresList.innerHTML = '';
    if (fishingHighScores.length === 0) {
        fishingScoresList.innerHTML = '<p>No records.</p>';
    } else {
        fishingHighScores.forEach((score, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${score} points`;
            fishingScoresList.appendChild(li);
        });
    }

    const jumpScoresList = document.getElementById('jump-high-scores');
    jumpScoresList.innerHTML = '';
    if (jumpHighScores.length === 0) {
        jumpScoresList.innerHTML = '<p>No records.</p>';
    } else {
        jumpHighScores.forEach((score, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${score} points`;
            jumpScoresList.appendChild(li);
        });
    }
}

// --- Сохранение и загрузка игры ---

function saveGame() {
    const gameData = {
        coins,
        clickPower,
        autoclickLevel, // Saved level
        currentCat,
        xp,
        level,
        passiveIncome,
        passiveUpgradeCount,
        lastRewardDate,
        streak,
        petLevels,
        upgradeLevel,
        soundEnabled,
        vibrationEnabled,
        fishingHighScores, // Save high scores
        jumpHighScores,
        criticalClickChance, // Save critical click chance
        criticalClickMultiplier,
        currentTheme // Save theme preference
    };
    localStorage.setItem('catClickerGame', JSON.stringify(gameData));
    showNotification('The game is saved!', 'info');
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

function loadGame() {
    const savedData = localStorage.getItem('catClickerGame');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        coins = gameData.coins || 0;
        clickPower = gameData.clickPower || 1;
        autoclickLevel = gameData.autoclickLevel || 0; // Load level
        currentCat = gameData.currentCat || 1;
        xp = gameData.xp || 0;
        level = gameData.level || 1;
        passiveIncome = gameData.passiveIncome || 0;
        passiveUpgradeCount = gameData.passiveUpgradeCount || 0;
        lastRewardDate = gameData.lastRewardDate || null;
        streak = gameData.streak || 0;
        petLevels = gameData.petLevels || {};
        upgradeLevel = gameData.upgradeLevel || 1;
        soundEnabled = gameData.soundEnabled !== undefined ? gameData.soundEnabled : true;
        vibrationEnabled = gameData.vibrationEnabled !== undefined ? gameData.vibrationEnabled : true;
        fishingHighScores = gameData.fishingHighScores || [];
        jumpHighScores = gameData.jumpHighScores || [];
        criticalClickChance = gameData.criticalClickChance !== undefined ? gameData.criticalClickChance : 0.02;
        criticalClickMultiplier = gameData.criticalClickMultiplier !== undefined ? gameData.criticalClickMultiplier : 3;
        currentTheme = gameData.currentTheme || 'light'; // Load theme

        document.getElementById('sound-toggle').checked = soundEnabled;
        document.getElementById('vibration-toggle').checked = vibrationEnabled;
        document.getElementById('theme-toggle').checked = (currentTheme === 'light'); // Set theme toggle based on loaded theme

        applyTheme(currentTheme); // Apply theme on load
        applyPetBonus(); // Reapply pet bonuses after loading to ensure stats are correct

        showNotification('Game loaded!', 'info');
    } else {
        showNotification('There are no saved games to load.', 'warning');
    }
    updateUI();
}

function resetGameConfirmation() {
    if (confirm("Are you sure you want to reset the game? All data will be lost!")) {
        resetGame();
    }
}

function resetGame() {
    localStorage.removeItem('catClickerGame');
    coins = 0;
    clickPower = 1;
    autoclickLevel = 0; // Reset autoclick level
    currentCat = 1;
    xp = 0;
    level = 1;
    comboCount = 0;
    comboMultiplier = 1;
    comboActive = false;
    passiveIncome = 0;
    passiveUpgradeCount = 0;
    lastRewardDate = null;
    streak = 0;
    petLevels = {};
    upgradeLevel = 1;
    soundEnabled = true;
    vibrationEnabled = true;
    fishingHighScores = [];
    jumpHighScores = [];
    criticalClickChance = 0.02;
    criticalClickMultiplier = 3;
    currentTheme = 'light';

    document.getElementById('sound-toggle').checked = true;
    document.getElementById('vibration-toggle').checked = true;
    document.getElementById('theme-toggle').checked = true; // Reset to light theme

    applyTheme('light'); // Apply light theme after reset
    showNotification('Игра сброшена!', 'error');
    updateUI();
    saveGame();
}

function resetPetsConfirmation() {
    if (confirm("Are you sure you want to reset all pets? You will lose all pet levels!")) {
        resetPets();
    }
}

function resetPets() {
    petLevels = {};
    applyPetBonus(); // Reapply bonuses after resetting pets
    showNotification('The pets are abandoned!', 'warning');
    updateUI();
    saveGame();
}

// --- Функции темы ---
function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme + '-theme');
    currentTheme = theme;
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveGame();
}

// --- Вспомогательные функции ---

function playClickSound() {
    if (soundEnabled) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Sound play error:", e));
    }
}

function playBuySound() {
    if (soundEnabled) {
        buySound.currentTime = 0;
        buySound.play().catch(e => console.log("Sound play error:", e));
    }
}

function playLevelUpSound() {
    if (soundEnabled) {
        levelUpSound.currentTime = 0;
        levelUpSound.play().catch(e => console.log("Sound play error:", e));
    }
}

function playCriticalSound() {
    if (soundEnabled) {
        criticalSound.currentTime = 0;
        criticalSound.play().catch(e => console.log("Sound play error:", e));
    }
}

function vibrate(duration) {
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// --- Инициализация игры при загрузке DOM ---

document.addEventListener('DOMContentLoaded', () => {
    loadGame();

    // ========= НАЧАЛО ВСТАВКИ =========
    try {
        if (Telegram && Telegram.WebApp) {
            const tg = Telegram.WebApp;

            // 1. Расширяем окно на весь экран
            tg.expand();

            // 2. Устанавливаем цвет хедера такой же, как фон приложения.
            tg.setHeaderColor('secondary_bg_color');

            // 3. Включаем системную кнопку "Назад" (свернуть).
            tg.BackButton.show();
            tg.onEvent('backButtonClicked', function() {
                tg.close();
            });
        }
    } catch (e) {
        console.error('Integration error with Telegram:', e);
    }
    // ========= КОНЕЦ ВСТАВКИ =========

    document.getElementById('cat-area').addEventListener('click', handleCatClick);

    // Settings overlay display/hide
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-overlay').classList.add('active');
    });
    document.getElementById('close-settings').addEventListener('click', () => {
        document.getElementById('settings-overlay').classList.remove('active');
    });
    // Close overlay by clicking outside (optional, but good UX)
    document.getElementById('settings-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'settings-overlay') {
            document.getElementById('settings-overlay').classList.remove('active');
        }
    });

    document.getElementById('sound-toggle').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        saveGame();
    });

    document.getElementById('vibration-toggle').addEventListener('change', (e) => {
        vibrationEnabled = e.target.checked;
        saveGame();
    });

    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        // If checked, it's light theme. If unchecked, it's dark theme.
        if (e.target.checked) {
            applyTheme('light');
        } else {
            applyTheme('dark');
        }
        saveGame();
    });

    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('onclick').match(/'(.*)'/)[1];
            showTab(tabId);
        });
    });

    showTab('tab-game');

    setInterval(gameTick, 1000);

    checkDailyReward();

    updateUI();
});

