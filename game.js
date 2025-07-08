let coins = 0;
let clickPower = 1;
let totalClicks = 0; // Добавлено для достижений
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
let achievements = {}; // Объект для хранения всех доступных достижений
let playerAchievements = {}; // Объект для хранения выполненных игроком достижений: { 'achievementId': true }
const achievementSound = new Audio('achievement.mp3'); // Создайте этот файл звука!

// Переменные для мини-игры "Погоня за мышкой"
let mouseChaseActive = false;
let mouseChaseScore = 0;
let mouseChaseTimer = 30; // Длительность игры в секундах
let mouseChaseInterval = null; // Интервал для основного таймера игры
let mouseSpawnInterval = null; // Интервал для спавна мышей
let mousesOnScreen = []; // Массив для отслеживания текущих мышей
let mouseChaseHighScore = 0; // Рекорд
const MOUSE_SPEED_MIN = 1; // Минимальная скорость движения мыши (px за тик)
const MOUSE_SPEED_MAX = 3; // Максимальная скорость
const MOUSE_DESPAWN_TIME = 2000; // Через сколько мс мышь исчезнет, если ее не кликнули
const MOUSE_TICK_RATE = 20; // Как часто обновляется положение мыши (мс)
const MOUSE_SPAWN_RATE = 1000; // Как часто спавнятся мыши (мс)
const mouseClickSound = new Audio('mouse_click.mp3'); // Создайте этот файл звука!
const gameEndSound = new Audio('game_end.mp3'); // Создайте этот файл звука!

let prestigePoints = 0; // Новая валюта: очки престижа
let prestigeMultiplier = 1; // Множитель дохода от престижа (1% за каждое очко престижа)
const PRESTIGE_LEVEL_REQUIREMENT = 100; // Требуемый уровень для престижа
const PRESTIGE_POINTS_PER_LEVEL = 1; // Сколько очков престижа дается за каждые 10 уровней выше требования
const prestigeSound = new Audio('prestige.mp3'); // Создайте этот файл звука!

// Local High Scores for Mini-games
let fishingHighScores = [];
let jumpHighScores = [];

const dailyRewards = [50, 100, 150, 200, 300, 500, 1000];

const clickSound = new Audio('meow.mp3');
const buySound = new Audio('buy.mp3');
const levelUpSound = new Audio('level_up.mp3');
const criticalSound = new Audio('critical_hit.mp3'); // New sound for critical clicks

let rodX = 300; // Начальная позиция удочки (по центру canvas)
const rodWidth = 60; // ширина "зоны ловли" удочки
const rodY = 0; // удочка всегда сверху
const rodSpeed = 18; // скорость перемещения удочки

let leaderboardInterval = null;

// --- Игровой цикл и основные функции ---

function handleCatClick(event) {
    if (jumpGameActive || fishingGameActive) return;

    let earnedCoins = clickPower * (1 + (level * 0.01)) * prestigeMultiplier; // Применяем множитель престижа
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
    totalClicks++; // Увеличиваем счетчик кликов

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

    checkAchievements('click'); // Вызываем проверку достижений после клика

}

function gameTick() {
    // Autoclick income based on its level
    if (autoclickLevel > 0) {
        coins += autoclickLevel * prestigeMultiplier;; // Each level gives 1 coin/sec
    }

    // Passive income based on its level
    coins += passiveIncome * prestigeMultiplier;;
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
    document.getElementById('upgrade-level-display').textContent = `(Lev. ${upgradeLevel})`;

    document.getElementById('autoclick-price').textContent = calculateUpgradeCost('autoclick');
    document.getElementById('autoclick-level-display').textContent = `(Lev. ${autoclickLevel})`;
    const autoclickInfo = document.getElementById('autoclick-info');
    if (autoclickLevel > 0) {
        autoclickInfo.textContent = `Auto-click is active. Coins/sec: ${autoclickLevel}`;
    } else {
        autoclickInfo.textContent = 'Buy an autoclicker at the shop!';
    }
    
    document.getElementById('passive-price').textContent = calculateUpgradeCost('passive');
    document.getElementById('passive-level-display').textContent = `(Lev. ${passiveUpgradeCount})`;
    
    // Обновление UI престижа
    document.getElementById('prestige-points').textContent = prestigePoints;
    document.getElementById('prestige-multiplier').textContent = prestigeMultiplier.toFixed(2);
    document.getElementById('prestige-req-level').textContent = PRESTIGE_LEVEL_REQUIREMENT;

    const prestigeButton = document.getElementById('prestige-button');
    if (prestigeButton) { // Проверяем, что кнопка существует
        if (level >= PRESTIGE_LEVEL_REQUIREMENT) {
            prestigeButton.disabled = false;
            prestigeButton.textContent = `Переродиться (получить ${Math.floor((level - PRESTIGE_LEVEL_REQUIREMENT) / 10) + 1} очков)`;
            prestigeButton.classList.remove('disabled');
        } else {
            prestigeButton.disabled = true;
            prestigeButton.textContent = `Переродиться (нужен ${PRESTIGE_LEVEL_REQUIREMENT} lev.)`;
            prestigeButton.classList.add('disabled');
        }
    }

    updatePetsUI();
    updateMiniGameHighScoresUI(); // Update mini-game high scores
    updateAchievementsUI(); // Добавлено
    renderCompanionPets(); // Добавлено
}

function levelUp() {
    level++;
    xp = 0;
    coins += level * 10; // Reward coins for leveling up
    showNotification(`Уровень повышен до ${level}!`, 'green');
    playLevelUpSound();
    vibrate(100);
    updateUI();
    checkAchievements('levelUp'); // Добавлено
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

    // Leaderboard: запускать/останавливать автообновление
    if (tabId === 'tab-leaderboard') {
        loadLeaders();
        leaderboardInterval = setInterval(loadLeaders, 5000);
    } else {
        if (leaderboardInterval) {
            clearInterval(leaderboardInterval);
            leaderboardInterval = null;
        }
    }

    if (tabId === 'tab-skins') {
        renderSkinsShop();
        renderOwnedSkins();
    }
}

async function loadLeaders() {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    let html = '';
    data.forEach((u, i) => {
        html += `<tr><td>${i+1}</td><td>${u.name}</td><td>${u.score}</td></tr>`;
    });
    document.getElementById('leaders').innerHTML = html;
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
            return Math.floor(10 * Math.pow(2, upgradeLevel - 1));
        case 'autoclick':
            return Math.floor(50 * Math.pow(1.5, autoclickLevel));
        case 'passive':
            return Math.floor(100 * Math.pow(1.5, passiveUpgradeCount));
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
                showNotification(`Автоматический клик улучшен до lev. ${autoclickLevel}!`, 'green');
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
        checkAchievements('petPurchase'); // Добавлено
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
    const petsList = document.getElementById('my-pets-list');
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
                <span class="item-price"><i class="fa-solid fa-coins"></i> ${getPetLevelUpCost(petType)}</span>
                <button class="ui-btn buy-btn" onclick="levelUpPet('${petType}')">
                    <i class="fas fa-level-up-alt"></i> Upgrade
                </button>
            `;
            petsList.appendChild(petDiv);
        }
    }

    if (!hasPets) {
        petsList.innerHTML = '<p style="text-align: center; color: #777;">You do not have any pets yet. Buy them in the store!</p>';
    }
}

function renderCompanionPets() {
    const area = document.getElementById('companions-area');
    area.innerHTML = '';
    const petIcons = {
        dog: '🐶',
        dragon: '🐉',
        phoenix: '🦜',
        unicorn: '🦄'
    };
    let left = 60;
    Object.keys(petLevels).forEach((pet, idx) => {
        if (petLevels[pet] > 0) {
            const el = document.createElement('span');
            el.className = 'companion-pet';
            el.textContent = petIcons[pet] || '🐾';
            el.style.left = `${left + idx * 40}px`;
            el.style.bottom = `${10 + Math.sin(Date.now()/400 + idx)*8}px`;
            area.appendChild(el);
        }
    });
}
// Вызови renderCompanionPets() после updateUI и при покупке/улучшении питомца

// Питомцы иногда приносят монеты:
setInterval(() => {
    Object.keys(petLevels).forEach(pet => {
        if (petLevels[pet] > 0 && Math.random() < 0.01) { // 1% шанс раз в секунду
            const bonus = 10 * petLevels[pet];
            coins += bonus;
            showNotification(`Your ${pet} brought you ${bonus} coins!`, 'success');
            updateUI();
        }
    });
}, 1000);

function updateAchievementsUI() {
    const achievementsListDiv = document.getElementById('achievements-list');
    achievementsListDiv.innerHTML = ''; // Очищаем список перед обновлением

    // Сортируем достижения: сначала выполненные, затем невыполненные
    const sortedAchievementIds = Object.keys(achievements).sort((aId1, aId2) => {
        const completed1 = playerAchievements[aId1] ? 1 : 0;
        const completed2 = playerAchievements[aId2] ? 1 : 0;
        return completed2 - completed1; // Сортируем так, чтобы выполненные были выше
    });

    if (Object.keys(achievements).length === 0) {
        achievementsListDiv.innerHTML = '<p style="text-align: center; color: #777;">No achievements defined.</p>';
        return;
    }

    sortedAchievementIds.forEach(id => {
        const ach = achievements[id];
        const isCompleted = playerAchievements[id];

        const achievementDiv = document.createElement('div');
        achievementDiv.classList.add('achievement-item');
        if (isCompleted) {
            achievementDiv.classList.add('completed');
        }

        achievementDiv.innerHTML = `
            <div class="achievement-icon">
                <i class="${isCompleted ? 'fa-solid fa-check-circle' : 'fa-solid fa-circle'}"></i>
            </div>
            <div class="achievement-details">
                <h4>${ach.name}</h4>
                <p>${ach.description}</p>
                <p class="achievement-reward">
                    Reward: ${ach.reward.coins || 0} <i class="fas fa-coins"></i>, ${ach.reward.xp || 0} XP
                </p>
            </div>
        `;
        achievementsListDiv.appendChild(achievementDiv);
    });
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

function initializeAchievements() {
    const allAchievements = [
        {
            id: 'first_click',
            name: 'First click',
            description: 'Make your first click.',
            reward: { coins: 10, xp: 5 },
            check: () => true // Это достижение всегда будет выполнено после первого клика
        },
        {
            id: 'total_clicks_100',
            name: 'Pusher',
            description: 'Click on the cat 100 times.',
            reward: { coins: 100, xp: 20 },
            check: () => totalClicks >= 100 // Понадобится новая переменная totalClicks
        },
        {
            id: 'level_10',
            name: 'Beginner',
            description: 'Reach level 10.',
            reward: { coins: 200, xp: 50 },
            check: () => level >= 10
        },
        {
            id: 'buy_dog',
            name: 'Best friend',
            description: 'Buy a dog.',
            reward: { coins: 150, xp: 30 },
            check: () => petLevels['dog'] !== undefined && petLevels['dog'] > 0
        },
        {
            id: 'fishing_master_50',
            name: 'Fish magnate',
            description: 'Score 50 points in the mini-game "Fishing".',
            reward: { coins: 300, xp: 60 },
            check: () => fishingHighScores.some(score => score >= 50)
        },
        {
            id: 'jump_hero_20',
            name: 'Jumper',
            description: 'Score 20 points in the mini-game "Cat Jumping".',
            reward: { coins: 300, xp: 60 },
            check: () => jumpHighScores.some(score => score >= 20)
        },
        // Добавьте больше достижений здесь
        {
            id: 'total_clicks_1000',
            name: 'Clicker-Profi',
            description: 'Click on the cat 1000 times.',
            reward: { coins: 500, xp: 100 },
            check: () => totalClicks >= 1000
        },
        {
            id: 'level_50',
            name: 'Experienced player',
            description: 'Reach level 50.',
            reward: { coins: 1000, xp: 200 },
            check: () => level >= 50
        },
        {
            id: 'buy_all_pets',
            name: 'Pet Collector',
            description: 'Buy all available pets.',
            reward: { coins: 2000, xp: 500 },
            check: () => Object.keys(petLevels).length === 4 // Исходит из того, что всего 4 питомца: dog, dragon, phoenix, unicorn
        }
    ];

    allAchievements.forEach(ach => {
        achievements[ach.id] = ach;
    });
}

function checkAchievements(type, data = null) {
    for (const id in achievements) {
        if (!playerAchievements[id]) { // Если достижение еще не выполнено
            const achievement = achievements[id];
            let isCompleted = false;

            // Проверка достижения в зависимости от его типа или данных события
            switch(id) {
                case 'first_click':
                case 'total_clicks_100':
                case 'total_clicks_1000':
                    if (type === 'click' && achievement.check()) {
                        isCompleted = true;
                    }
                    break;
                case 'level_10':
                case 'level_50':
                    if (type === 'levelUp' && achievement.check()) {
                        isCompleted = true;
                    }
                    break;
                case 'buy_dog':
                case 'buy_all_pets':
                    if (type === 'petPurchase' && achievement.check()) {
                        isCompleted = true;
                    }
                    break;
                case 'fishing_master_50':
                    if (type === 'fishingGameEnd' && achievement.check()) {
                        isCompleted = true;
                    }
                    break;
                case 'jump_hero_20':
                    if (type === 'jumpGameEnd' && achievement.check()) {
                        isCompleted = true;
                    }
                    break;
                // Добавьте сюда другие проверки для новых достижений
            }

            if (isCompleted) {
                playerAchievements[id] = true;
                coins += achievement.reward.coins || 0;
                xp += achievement.reward.xp || 0;
                showNotification(`Достижение выполнено: "${achievement.name}"!`, 'success');
                playAchievementSound();
                vibrate(200);
                saveGame();
                updateUI();
                updateAchievementsUI();
            }
        }
    }

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
    } else if (gameType === 'mouseChase') {
        document.getElementById('mouse-chase-game').style.display = 'flex';
        startMouseChaseGame();
    } 
}

// Рыбалка
function startFishingGame() {
    fishingScore = 0;
    let timer = 30;
    const fishingTimerDisplay = document.getElementById('fishing-timer');
    const fishingScoreDisplay = document.getElementById('fishing-score-display');
    fishingScoreDisplay.textContent = fishingScore;
    fishingTimerDisplay.textContent = timer;

    const canvas = document.getElementById('fishing-canvas');
    const ctx = canvas.getContext('2d');
    let fishes = [];
    let hook = { x: canvas.width / 2, y: 0, vy: 0, isCasting: false, isReeling: false };
    let isGameActive = true;

    // 3D water effect
    function drawWater() {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(canvas.width/2, canvas.height-20, canvas.width/2-10, 30, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(33,150,243,0.15)';
        ctx.fill();
        ctx.restore();
    }

    // Draw hook
    function drawHook() {
        ctx.save();
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hook.x, 0);
        ctx.lineTo(hook.x, hook.y);
        ctx.stroke();

        // 3D hook
        ctx.beginPath();
        ctx.arc(hook.x, hook.y, 10, 0, Math.PI*2);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#0288d1";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.strokeStyle = "#0288d1";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    // Draw fishes
    function drawFishes() {
        fishes.forEach(fish => {
            ctx.save();
            ctx.translate(fish.x, fish.y);
            ctx.scale(fish.flip ? -1 : 1, 1);
            ctx.rotate(Math.sin(Date.now()/300 + fish.x) * 0.07);
            // 3D shadow
            ctx.beginPath();
            ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI*2);
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fill();
            // Fish body
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI*2);
            ctx.fillStyle = fish.color;
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 8;
            ctx.fill();
            // Eye
            ctx.beginPath();
            ctx.arc(8, -3, 2, 0, Math.PI*2);
            ctx.fillStyle = "#222";
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(-22, 0);
            ctx.lineTo(-32, -8);
            ctx.lineTo(-32, 8);
            ctx.closePath();
            ctx.fillStyle = fish.color;
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }

    // Animate
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWater();
        drawFishes();
        drawHook();
        if (isGameActive) requestAnimationFrame(animate);
    }

    // Fish logic
    function spawnFish() {
        if (!isGameActive) return;
        const colors = ["#ffb300", "#039be5", "#43a047", "#e53935", "#8e24aa"];
        const fish = {
            x: Math.random() * (canvas.width - 80) + 40,
            y: Math.random() * (canvas.height - 120) + 100,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 0.7,
            color: colors[Math.floor(Math.random() * colors.length)],
            flip: Math.random() > 0.5,
            points: Math.floor(Math.random() * 20) + 10
        };
        fishes.push(fish);
        setTimeout(() => {
            fishes = fishes.filter(f => f !== fish);
        }, 6000 + Math.random()*2000);
    }

    let fishSpawner = setInterval(spawnFish, 1200);

    // Hook movement and catching
    canvas.onmousedown = (e) => {
        if (hook.isCasting || hook.isReeling) return;
        hook.isCasting = true;
        hook.vy = 7;
    };

    canvas.onmouseup = (e) => {
        if (!hook.isCasting && !hook.isReeling) return;
        hook.isCasting = false;
        hook.isReeling = true;
        hook.vy = -10;
    };

    function updateHook() {
        if (hook.isCasting) {
            hook.y += hook.vy;
            if (hook.y > canvas.height - 30) {
                hook.y = canvas.height - 30;
                hook.vy = 0;
            }
        } else if (hook.isReeling) {
            hook.y += hook.vy;
            if (hook.y <= 0) {
                hook.y = 0;
                hook.vy = 0;
                hook.isReeling = false;
            }
        }
        // Check catch
        fishes.forEach((fish, idx) => {
            if (
                Math.abs(hook.x - fish.x) < 25 &&
                Math.abs(hook.y - fish.y) < 18 &&
                (hook.isCasting || hook.isReeling)
            ) {
                fishingScore += fish.points;
                document.getElementById('fishing-score-display').textContent = fishingScore;
                fishes.splice(idx, 1);
                playClickSound();
            }
        });
    }

    // Main game loop
    let hookInterval = setInterval(updateHook, 20);

    // Timer
    fishingTimerCountdown = setInterval(() => {
        timer--;
        fishingTimerDisplay.textContent = timer;
        if (timer <= 0) {
            clearInterval(fishingTimerCountdown);
            clearInterval(fishSpawner);
            clearInterval(hookInterval);
            isGameActive = false;
            endFishingGame();
        }
    }, 1000);

    animate();
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
    checkAchievements('fishingGameEnd'); // Добавлено
}

document.getElementById('close-fishing').addEventListener('click', () => {
    clearInterval(fishingInterval);
    clearInterval(fishingTimerCountdown);
    endFishingGame();
});

// Погони за мышкой
function startMouseChaseGame() {
    let score = 0;
    let timer = 30;
    let mice = [];
    let isGameActive = true;

    document.getElementById('mouse-chase-score-display').textContent = score;
    document.getElementById('mouse-chase-timer').textContent = timer;

    const canvas = document.getElementById('mouse-chase-canvas');
    const ctx = canvas.getContext('2d');

    function drawMouse(mouse) {
        const skin = allSkins.find(s => s.id === selectedSkins.mouse);
        if (skin && skin.img) {
            const img = new Image();
            img.src = skin.img;
            img.onload = () => {
                ctx.save();
                ctx.translate(mouse.x, mouse.y);
                ctx.scale(mouse.flip ? -1 : 1, 1);
                ctx.drawImage(img, -24, -24, 48, 48);
                // Эффект glow
                if (skin.effect === 'glow') {
                    ctx.globalAlpha = 0.6;
                    ctx.shadowColor = "#ffd700";
                    ctx.shadowBlur = 18;
                    ctx.drawImage(img, -28, -28, 56, 56);
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                }
                ctx.restore();
            };
        } else {
            ctx.save();
            ctx.translate(mouse.x, mouse.y);
            ctx.scale(mouse.flip ? -1 : 1, 1);
            ctx.rotate(Math.sin(Date.now() / 300 + mouse.x) * 0.07);

            // Shadow
            ctx.beginPath();
            ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.18)";
            ctx.fill();

            // Body (3D)
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#bdbdbd";
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 8;
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.ellipse(14, -4, 8, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = "#bdbdbd";
            ctx.fill();

            // Ears
            ctx.beginPath();
            ctx.arc(20, -10, 4, 0, Math.PI * 2);
            ctx.arc(10, -10, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#888";
            ctx.fill();

            // Nose
            ctx.beginPath();
            ctx.arc(23, -3, 2, 0, Math.PI * 2);
            ctx.fillStyle = "#e57373";
            ctx.fill();

            // Eyes
            ctx.beginPath();
            ctx.arc(18, -6, 1.5, 0, Math.PI * 2);
            ctx.arc(12, -6, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = "#222";
            ctx.fill();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-22, 2);
            ctx.bezierCurveTo(-32, 10, -38, -10, -25, -18);
            ctx.strokeStyle = "#a1887f";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.restore();
        }
    }

    function spawnMouse() {
        if (!isGameActive) return;
        const mouse = {
            x: Math.random() > 0.5 ? 40 : canvas.width - 40,
            y: Math.random() * (canvas.height - 80) + 40,
            vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
            flip: Math.random() > 0.5,
            alive: true
        };
        mice.push(mouse);
        setTimeout(() => {
            mouse.alive = false;
        }, 2500 + Math.random() * 1000);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw all mice
        mice.forEach(mouse => {
            if (mouse.alive) drawMouse(mouse);
        });
        if (isGameActive) requestAnimationFrame(animate);
    }

    function moveMice() {
        mice.forEach(mouse => {
            if (mouse.alive) {
                mouse.x += mouse.vx;
                if (mouse.x < 20 || mouse.x > canvas.width - 20) {
                    mouse.vx *= -1;
                    mouse.flip = !mouse.flip;
                }
            }
        });
        // Remove dead mice
        mice = mice.filter(m => m.alive);
    }

    canvas.onclick = function(e) {
        if (!isGameActive) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let caught = false;
        mice.forEach(mouse => {
            if (
                mouse.alive &&
                Math.abs(mx - mouse.x) < 25 &&
                Math.abs(my - mouse.y) < 18
            ) {
                mouse.alive = false;
                score++;
                document.getElementById('mouse-chase-score-display').textContent = score;
                if (typeof playClickSound === "function") playClickSound();
                caught = true;
            }
        });
        if (caught) showNotification('Mouse caught!', 'success');
    };

    // Game loop
    let moveInterval = setInterval(moveMice, 20);
    let spawnInterval = setInterval(spawnMouse, 900);

    let timerInterval = setInterval(() => {
        timer--;
        document.getElementById('mouse-chase-timer').textContent = timer;
        if (timer <= 0) {
            isGameActive = false;
            clearInterval(moveInterval);
            clearInterval(spawnInterval);
            clearInterval(timerInterval);
            endMouseChaseGame(score);
        }
    }, 1000);

    animate();

    document.getElementById('close-mouse-chase').onclick = () => {
        isGameActive = false;
        clearInterval(moveInterval);
        clearInterval(spawnInterval);
        clearInterval(timerInterval);
        document.getElementById('mouse-chase-game').style.display = 'none';
    };
}

// Прыжки с котом
function startJumpGame() {
    jumpScore = 0;
    let isJumping = false;
    let catY = 250;
    let catVY = 0;
    let gravity = 1;
    let groundY = 250;
    let obstacleX = 600;
    let obstacleSpeed = 5;
    let isGameActive = true;

    const canvas = document.getElementById('jump-canvas');
    const ctx = canvas.getContext('2d');
    document.getElementById('jump-score').textContent = jumpScore;

    function drawGround() {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(300, groundY + 40, 260, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 144, 156, 0.18)';
        ctx.fill();
        ctx.restore();
    }

    function drawCat() {
        ctx.save();
        ctx.translate(100, catY);
        ctx.scale(1, 1);
        ctx.shadowColor = "#1976d2";
        ctx.shadowBlur = 16;
        // Cat body (3D effect)
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb300";
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, -20, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb300";
        ctx.fill();
        // Eyes
        ctx.beginPath();
        ctx.arc(-5, -23, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -23, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#222";
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.lineTo(-15, -42);
        ctx.lineTo(-5, -30);
        ctx.moveTo(10, -32);
        ctx.lineTo(15, -42);
        ctx.lineTo(5, -30);
        ctx.strokeStyle = "#ffb300";
        ctx.lineWidth = 3;
        ctx.stroke();
        // Shadow under cat
        ctx.beginPath();
        ctx.ellipse(0, 28, 18, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fill();
        ctx.restore();
    }

    function drawObstacle() {
        ctx.save();
        ctx.translate(obstacleX, groundY + 10);
        ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
        // 3D block
        ctx.beginPath();
        ctx.rect(-15, -30, 30, 60);
        ctx.fillStyle = "#8d6e63";
        ctx.shadowColor = "#333";
        ctx.shadowBlur = 10;
        ctx.fill();
        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, 35, 15, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGround();
        drawObstacle();
        drawCat();
        if (isGameActive) requestAnimationFrame(animate);
    }

    function gameTick() {
        // Cat physics
        catY += catVY;
        catVY += gravity;
        if (catY > groundY) {
            catY = groundY;
            catVY = 0;
            isJumping = false;
        }
        // Obstacle movement
        obstacleX -= obstacleSpeed;
        if (obstacleX < -30) {
            obstacleX = 600 + Math.random() * 80;
            jumpScore++;
            document.getElementById('jump-score').textContent = jumpScore;
            obstacleSpeed += 0.15;
            showNotification(`Point! Current score: ${jumpScore}`, 'info');
        }
        // Collision
        if (
            100 + 28 > obstacleX - 15 &&
            100 - 28 < obstacleX + 15 &&
            catY + 18 > groundY - 30
        ) {
            if (!isJumping) {
                endJumpGame(jumpScore);
                isGameActive = false;
            }
        }
    }

    let tickInterval = setInterval(gameTick, 20);
    animate();

    canvas.onclick = () => {
        if (!isJumping && isGameActive) {
            catVY = -16;
            isJumping = true;
        }
    };

    document.getElementById('close-jump').onclick = () => {
        isGameActive = false;
        clearInterval(tickInterval);
        document.getElementById('jump-game').style.display = 'none';
    };
}

function endJumpGame(score) {
    jumpGameActive = false;
    document.getElementById('jump-game').style.display = 'none';
    const finalBonus = score * 5;
    coins += finalBonus;
    xp += score * 2;
    showNotification(`The jumps are over! You scored ${score} points & earned ${finalBonus} coins!`, 'success');

    // Update high score for jump
    if (!window.jumpHighScore || score > window.jumpHighScore) {
        window.jumpHighScore = score;
        showNotification(`New record in Jumping Cat: ${score} points!`, 'gold');
    }
    updateUI();
    saveGame();
    checkAchievements('jumpGameEnd');
}

function updateMiniGameHighScoresUI() {
    const fishingScoresList = document.getElementById('fishing-high-scores');
    fishingScoresList.innerHTML = '';
    if (fishingHighScores.length === 0) {
        fishingScoresList.innerHTML = '<p>No records.</p>';
    } else {
        const bestFishing = Math.max(...fishingHighScores);
        const li = document.createElement('li');
        li.textContent = `Best: ${bestFishing} points`;
        fishingScoresList.appendChild(li);
    }

    const jumpScoresList = document.getElementById('jump-high-scores');
    jumpScoresList.innerHTML = '';
    if (jumpHighScores.length === 0) {
        jumpScoresList.innerHTML = '<p>No records.</p>';
    } else {
        const bestJump = Math.max(...jumpHighScores);
        const li = document.createElement('li');
        li.textContent = `Best: ${bestJump} points`;
        jumpScoresList.appendChild(li);
    }

    const mouseChaseHighScoreElement = document.getElementById('mouse-chase-high-score-display');
    if (mouseChaseHighScoreElement) {
        mouseChaseHighScoreElement.textContent = mouseChaseHighScore;
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
        currentTheme, // Save theme preference
        totalClicks, // Добавлено
        playerAchievements, // Добавлено
        prestigePoints, // Добавлено
        prestigeMultiplier, // Добавлено
        mouseChaseHighScore // Добавлено
    };
    localStorage.setItem('catClickerGame', JSON.stringify(gameData));
    showNotification('The game is saved!', 'info');
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    if (isNaN(coins)) coins = 0;
}

function loadGame() {
    const savedData = localStorage.getItem('catClickerGame');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        coins = Number(gameData.coins);
        if (isNaN(coins)) coins = 0;
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
        totalClicks = gameData.totalClicks || 0; // Добавлено
        playerAchievements = gameData.playerAchievements || {}; // Добавлено
        prestigePoints = gameData.prestigePoints || 0; // Добавлено
        prestigeMultiplier = gameData.prestigeMultiplier || 1; // Добавлено
        mouseChaseHighScore = gameData.mouseChaseHighScore || 0; // Добавлено

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

function performPrestige() {
    if (level < PRESTIGE_LEVEL_REQUIREMENT) {
        showNotification(`Вам нужно достичь ${PRESTIGE_LEVEL_REQUIREMENT} уровня, чтобы переродиться.`, 'error');
        return;
    }

    if (!confirm(`Вы уверены, что хотите переродиться? Вы потеряете все монеты, XP, уровни, улучшения и питомцев, но получите очки престижа, которые дадут постоянный множитель к доходу.`)) {
        return;
    }

    // Рассчитываем очки престижа
    const earnedPrestigePoints = Math.floor((level - PRESTIGE_LEVEL_REQUIREMENT) / 10) + 1; // Минимум 1 очко за первый престиж
    prestigePoints += earnedPrestigePoints;
    prestigeMultiplier = 1 + (prestigePoints * 0.01); // Каждое очко престижа дает +1% к множителю

    // Сброс прогресса
    coins = 0;
    clickPower = 1;
    autoclickLevel = 0;
    xp = 0;
    level = 1;
    passiveIncome = 0;
    passiveUpgradeCount = 0;
    petLevels = {}; // Сброс питомцев
    upgradeLevel = 1;
    totalClicks = 0; // Сброс счетчика кликов для достижений
    // playerAchievements = {}; // Опционально: сбросить достижения. Я рекомендую НЕ сбрасывать достижения.

    showNotification(`Вы переродились и получили ${earnedPrestigePoints} очков престижа! Ваш множитель дохода теперь x${prestigeMultiplier.toFixed(2)}.`, 'success');
    playPrestigeSound(); // Воспроизвести звук престижа
    vibrate(300); // Долгая вибрация
    saveGame();
    updateUI();
    // Закрываем все открытые вкладки и возвращаемся на главную
    showTab('tab-game');
}

function playPrestigeSound() {
    if (soundEnabled) {
        prestigeSound.currentTime = 0;
        prestigeSound.play().catch(e => console.error("Error playing prestige sound:", e));
    }
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

function playAchievementSound() {
    if (soundEnabled && typeof achievementSound !== 'undefined') {
        achievementSound.currentTime = 0;
        achievementSound.play().catch(e => console.log("Sound play error:", e));
    }
}

function vibrate(duration) {
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// --- Инициализация игры при загрузке DOM ---

document.addEventListener('DOMContentLoaded', () => {
    initializeAchievements(); // Добавлено
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

    updateCatSkin(); // <-- Добавь вызов после updateUI()
});

// --- Скины ---
const allSkins = [
    { id: 'cat1', name: 'Classic Cat', price: 0, type: 'cat', img: 'cat1.png', rarity: 'common' },
    { id: 'cat2', name: 'Ninja Cat', price: 500, type: 'cat', img: 'cat2.png', rarity: 'rare' },
    { id: 'cat3', name: 'Golden Cat', price: 2000, type: 'cat', img: 'cat3.png', rarity: 'epic', effect: 'shine' },
    { id: 'mouse1', name: 'Gray Mouse', price: 0, type: 'mouse', img: 'mouse1.png', rarity: 'common' },
    { id: 'mouse2', name: 'Cheese Mouse', price: 400, type: 'mouse', img: 'mouse2.png', rarity: 'rare' },
    { id: 'fish1', name: 'Blue Fish', price: 0, type: 'fish', img: 'fish1.png', rarity: 'common' },
    { id: 'fish2', name: 'Gold Fish', price: 1000, type: 'fish', img: 'fish2.png', rarity: 'epic', effect: 'glow' }
];

let ownedSkins = JSON.parse(localStorage.getItem('ownedSkins') || '["cat1","mouse1","fish1"]');
let selectedSkins = JSON.parse(localStorage.getItem('selectedSkins') || '{"cat":"cat1","mouse":"mouse1","fish":"fish1"}');

function saveSkins() {
    localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
    localStorage.setItem('selectedSkins', JSON.stringify(selectedSkins));
}

function renderSkinsShop() {
    const shop = document.getElementById('skins-shop-list');
    shop.innerHTML = '';
    allSkins.forEach(skin => {
        if (ownedSkins.includes(skin.id)) return;
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        div.innerHTML = `
            <div class="item-info">
                <h4>${skin.name} <span style="font-size:0.8em; color:#888;">[${skin.rarity}]</span></h4>
                <img src="${skin.img}" alt="${skin.name}" style="width:48px; height:48px; border-radius:12px; box-shadow:0 2px 8px #0002;">
            </div>
            <div class="item-price"><i class="fa-solid fa-coins"></i> ${skin.price}</div>
            <button class="buy-btn ui-btn" onclick="buySkin('${skin.id}')">Buy</button>
        `;
        shop.appendChild(div);
    });
}

function renderOwnedSkins() {
    const owned = document.getElementById('owned-skins-list');
    owned.innerHTML = '';
    ['cat','mouse','fish'].forEach(type => {
        const skins = allSkins.filter(s => s.type === type && ownedSkins.includes(s.id));
        const title = type.charAt(0).toUpperCase() + type.slice(1) + ' skins:';
        const div = document.createElement('div');
        div.innerHTML = `<h4>${title}</h4>`;
        skins.forEach(skin => {
            const btn = document.createElement('button');
            btn.className = 'ui-btn';
            btn.innerHTML = `<img src="${skin.img}" alt="${skin.name}" style="width:32px; height:32px; border-radius:8px;vertical-align:middle;"> ${skin.name}` +
                (selectedSkins[type] === skin.id ? ' <span style="color:#28a745;">(Selected)</span>' : '');
            btn.onclick = () => selectSkin(type, skin.id);
            div.appendChild(btn);
        });
        owned.appendChild(div);
    });
}

function buySkin(id) {
    const skin = allSkins.find(s => s.id === id);
    if (!skin) return;
    if (coins < skin.price) {
        showNotification('Not enough coins!', 'error');
        return;
    }
    coins -= skin.price;
    ownedSkins.push(id);
    showNotification(`You bought ${skin.name}!`, 'success');
    saveSkins();
    updateUI();
    renderSkinsShop();
    renderOwnedSkins();
}

function selectSkin(type, id) {
    selectedSkins[type] = id;
    saveSkins();
    renderOwnedSkins();
    showNotification(`Selected new ${type} skin!`, 'success');
    updateUI();
    updateCatSkin(); // <-- Добавь вызов для кота

    // Перерисовка canvas-игр (если мини-игра сейчас активна)
    if (type === 'mouse' && document.getElementById('mouse-chase-game').style.display !== 'none') {
        startMouseChaseGame();
    }
    if (type === 'fish' && document.getElementById('fishing-game').style.display !== 'none') {
        startFishingGame();
    }
}

function updateCatSkin() {
    const catImg = document.getElementById('cat-img');
    if (catImg && selectedSkins && selectedSkins.cat) {
        catImg.src = allSkins.find(s => s.id === selectedSkins.cat)?.img || 'cat1.png';
        // Эффект shine для кота
        const skin = allSkins.find(s => s.id === selectedSkins.cat);
        if (skin && skin.effect === 'shine') {
            catImg.classList.add('skin-shine');
        } else {
            catImg.classList.remove('skin-shine');
        }
    }
}

// --- Фоновая анимация ---

function startBackgroundAnimation() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Подгоняем размер под окно
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Генерируем облака и звёзды
    let clouds = [];
    let stars = [];
    function generateClouds() {
        clouds = [];
        for (let i = 0; i < 7; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.4,
                r: 40 + Math.random() * 60,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.5 + Math.random() * 0.3
            });
        }
    }
    function generateStars() {
        stars = [];
        for (let i = 0; i < 80; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                r: 0.7 + Math.random() * 1.5,
                opacity: 0.5 + Math.random() * 0.5
            });
        }
    }
    generateClouds();
    generateStars();

    // Генерируем листья и пузырьки
    let leaves = [];
    let bubbles = [];
    function generateLeaves() {
        leaves = [];
        for (let i = 0; i < 15; i++) {
            leaves.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: 12 + Math.random() * 14,
                speedY: 0.5 + Math.random() * 1.2,
                speedX: -0.5 + Math.random(),
                angle: Math.random() * Math.PI * 2,
                color: ['#ffb300', '#ff7043', '#a1887f', '#ffd54f'][Math.floor(Math.random()*4)],
                swing: 0.5 + Math.random() * 1.5
            });
        }
    }
    function generateBubbles() {
        bubbles = [];
        for (let i = 0; i < 18; i++) {
            bubbles.push({
                x: Math.random() * canvas.width,
                y: canvas.height - (Math.random() * 80),
                r: 6 + Math.random() * 10,
                speed: 0.4 + Math.random() * 0.7,
                opacity: 0.2 + Math.random() * 0.4
            });
        }
    }
    generateLeaves();
    generateBubbles();

    // Анимация
    function animate() {
        // Определяем время суток
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;

        // Фон неба
        if (isNight) {
            // Ночь
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, "#0d133d");
            grad.addColorStop(1, "#232b50");
            ctx.fillStyle = grad;
        } else {
            // День
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, "#b3e5fc");
           
            grad.addColorStop(1, "#e0f7fa");
            ctx.fillStyle = grad;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Звёзды ночью
        if (isNight) {
            stars.forEach(star => {
               
                ctx.save();
                ctx.globalAlpha = star.opacity * (0.7 + 0.3 * Math.sin(Date.now()/700 + star.x));
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fillStyle = "#fffde7";
                ctx.shadowColor = "#fff";
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
            });
        }

        // Облака днём
        if (!isNight) {
            clouds.forEach(cloud => {
                ctx.save();
                ctx.globalAlpha = cloud.opacity;
                ctx.beginPath();
                ctx.ellipse(cloud.x, cloud.y, cloud.r, cloud.r * 0.6, 0, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.shadowColor = "#b3e5fc";
                ctx.shadowBlur = 24;
                ctx.fill();
                ctx.restore();

                cloud.x += cloud.speed;
                if (cloud.x - cloud.r > canvas.width) {
                    cloud.x = -cloud.r;
                    cloud.y = Math.random() * canvas.height * 0.4;
                }
            });
        }

        // Листья осенью (показывать с сентября по ноябрь)
        const month = new Date().getMonth();
        const isAutumn = month >= 8 && month <= 10;
        if (isAutumn) {
            leaves.forEach(leaf => {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.translate(leaf.x, leaf.y);
                ctx.rotate(leaf.angle + Math.sin(Date.now()/600 + leaf.x));
                ctx.beginPath();
                ctx.ellipse(0, 0, leaf.r, leaf.r * 0.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = leaf.color;
                ctx.shadowColor = "#ffecb3";
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();

                leaf.x += Math.sin(Date.now()/800 + leaf.y) * leaf.swing + leaf.speedX;
                leaf.y += leaf.speedY;
                leaf.angle += 0.01 + Math.random()*0.01;
                if (leaf.y > canvas.height + 20) {
                    leaf.x = Math.random() * canvas.width;
                    leaf.y = -20;
                }
                if (leaf.x < -30 || leaf.x > canvas.width + 30) {
                    leaf.x = Math.random() * canvas.width;
                }
            });
        }

        // Пузырьки на воде (только днём)
        if (!isNight) {
            bubbles.forEach(bubble => {
                ctx.save();
                ctx.globalAlpha = bubble.opacity;
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
                ctx.fillStyle = "#b3e5fc";
                ctx.shadowColor = "#fff";
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.restore();

                bubble.y -= bubble.speed;
                if (bubble.y < canvas.height * 0.6) {
                    bubble.x = Math.random() * canvas.width;
                    bubble.y = canvas.height - (Math.random() * 40);
                }
            });
        }

        requestAnimationFrame(animate);
    }

    animate();

    // Перегенерировать всё при ресайзе
    window.addEventListener('resize', () => {
        generateClouds();
        generateStars();
        generateLeaves();
        generateBubbles();
    });
}

// Telegram gift sending button
document.getElementById('send-gift-btn').addEventListener('click', () => {
    if (typeof Telegram === 'undefined' || !Telegram.WebApp) {
        showNotification('Gift sending is available only in Telegram WebApp!', 'error');
        return;
    }
    // Пример: отправляем 100 монет другу (можно сделать выбор подарка)
    const gift = { type: 'coins', amount: 100 };
    Telegram.WebApp.sendData(JSON.stringify({ action: 'send_gift', gift }));
    showNotification('Gift sent! Ask your friend to accept it in their Telegram WebApp.', 'success');
});

// Пример для background-canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

document.addEventListener('keydown', function(e) {
    if (document.getElementById('fishing-game').style.display !== 'none') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) {
            rodX = Math.max(rodX - rodSpeed, rodWidth/2);
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rodX = Math.min(rodX + rodSpeed, 600 - rodWidth/2);
        }
    }
});

// Нарисовать удочку
ctx.save();
ctx.strokeStyle = "#795548";
ctx.lineWidth = 6;
ctx.beginPath();
ctx.moveTo(rodX, rodY);
ctx.lineTo(rodX, rodY + 60); // длина удочки
ctx.stroke();
// Зона ловли (крючок)
ctx.beginPath();
ctx.arc(rodX, rodY + 60, rodWidth/2, 0, Math.PI, true);
ctx.strokeStyle = "#ffb300";
ctx.lineWidth = 4;
ctx.stroke();
ctx.restore();

canvas.addEventListener('click', function(e) {
    // ...получить координаты клика...
    // Вместо проверки по всей рыбке:
    // if (рыбка под мышкой)
    // теперь:
    if (
        fish.y >= rodY + 60 - fish.radius && fish.y <= rodY + 60 + fish.radius &&
        Math.abs(fish.x - rodX) < rodWidth/2
    ) {
        // поймать рыбку!
    }
});

// Пример JS (game.js или отдельный файл)
document.getElementById('theme-toggle').addEventListener('change', function() {
    document.body.classList.toggle('dark-theme', this.checked);
    // Можно добавить сохранение в localStorage, если нужно
});