let coins = 0;
let clickPower = 1;
let autoclick = false;
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
let passiveIncome = 0;
let passiveUpgradeCount = 0;
let lastRewardDate = null;
let streak = 0;
let petLevels = {};
let upgradeLevel = 1; // уровень клика
const xpPerClick = 1;
const xpToNextLevel = () => 10 + (level - 1) * 10;
let uiUpdateTimer = null; // Corrected from previous error


const dailyRewards = [50, 100, 150, 200, 300, 500, 1000]; // **Move this here**

// Оптимизация монеток
const coinPool = [];
const MAX_COINS = 15;

function createCoinElement(x, y, amount) {
    let coin = coinPool.pop();
    if (!coin) {
        coin = document.createElement('div');
        coin.className = 'coin-float';
        document.getElementById('cat-area').appendChild(coin);
    }
    
    coin.textContent = `+${amount}`;
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;
    coin.style.display = 'block';
    
    setTimeout(() => {
        coin.style.display = 'none';
        coinPool.push(coin);
    }, 700);
}

function getUpgradePrice() {
    return Math.floor(15 * Math.pow(1.4, upgradeLevel - 1));
}

function getPassivePrice() {
    return Math.floor(30 * Math.pow(1.3, passiveUpgradeCount));
}

function updateShopUI() {
    document.getElementById('click-level').textContent = upgradeLevel;
    // обновите цену на кнопке
    document.getElementById('upgrade-btn').textContent = `Upgrade click (${getUpgradePrice()}🪙)`;
    // ...обновите другие значения, если нужно...
}

const achievements = [
    { id: 'firstClick', text: 'First click!', icon: '🐾', condition: (state) => state.totalClicks >= 1 },
    { id: 'hundredClicks', text: '100 clicks!', icon: '💯', condition: (state) => state.totalClicks >= 100 },
    { id: 'clickMaster', text: 'Click Master: 500 clicks!', icon: '👆', condition: (state) => state.totalClicks >= 500 },
    { id: 'clickGod', text: 'Click God: 5000 clicks!', icon: '🖱️', condition: (state) => state.totalClicks >= 5000 },
    { id: 'millionaire', text: 'Millionaire: 10,000 coins!', icon: '💰', condition: (state) => state.coins >= 10000 },
    { id: 'petCollector', text: 'Pet Collector!', icon: '🐶', condition: (state) => Object.values(ownedPets).every(Boolean) },
    { id: 'skinCollector', text: 'Skin Collector!', icon: '🎨', condition: (state) => Object.values(ownedSkins).every(Boolean) },
    { id: 'upgradeGuru', text: 'Upgrade Guru: 20 upgrades!', icon: '⬆️', condition: (state) => state.upgrades >= 20 },
    { id: 'passiveKing', text: 'Passive King: 10/sec!', icon: '⏳', condition: (state) => passiveIncome >= 10 },
    { id: 'boosterFan', text: 'Booster Fan: 10 times!', icon: '⚡', condition: (state) => state.boostersUsed >= 10 },
    { id: 'autoclickerPro', text: 'Autoclicker Pro: 10 times!', icon: '🤖', condition: (state) => state.autoclickersUsed >= 10 },
    { id: 'dailyStreak', text: 'Daily Streak: 7 days!', icon: '📅', condition: (state) => state.dailyStreak >= 7 },
    { id: 'unicornLuck', text: 'Lucky: caught the unicorn!', icon: '🦄', condition: (state) => ownedPets.unicorn },
    { id: 'collectionFull', text: 'Collection Complete!', icon: '🏆', condition: (state) => Object.values(ownedPets).every(Boolean) && Object.values(ownedSkins).every(Boolean) },
    { id: 'legend', text: 'CatClicker Legend: Level 20!', icon: '🌟', condition: (state) => level >= 20 }
];
let unlockedAchievements = [];

function updateUI() {
    document.getElementById('coin-count').textContent = coins;
    updatePassiveUI();       // Добавьте эту строку
    updateShopUI();          // Добавьте эту строку
    updateLevelUI();         // Добавьте эту строку
    updateAutoclickTimerUI(); // Добавьте эту строку
    updateBoosterTimerUI();  // Добавьте эту строку
    updatePetInfo();         // Добавьте эту строку
    updatePetImage();        // Добавьте эту строку
    updatePetsCollection();  // Добавьте эту строку
    updateUpgradeButton();   // Добавьте эту строку
    // ИЛИ убедитесь, что они там уже есть.
}

function showNotification(text) {
    const notif = document.getElementById('notification');
    notif.textContent = text;
    setTimeout(() => notif.textContent = '', 1500);
}

function updateLevelUI() {
    document.getElementById('level').textContent = level;
    const percent = Math.min(100, (xp / xpToNextLevel()) * 100);
    document.getElementById('xp-progress').style.width = percent + 'px';
}

function gainXP(amount) {
    xp += amount;
    while (xp >= xpToNextLevel()) {
        xp -= xpToNextLevel();
        level++;
        // Можно добавить бонусы за уровень!
    }
    updateLevelUI();
}

function checkAchievements(state) {
    achievements.forEach(a => {
        if (!unlockedAchievements.includes(a.id) && a.condition(state)) {
            unlockedAchievements.push(a.id);
            showAchievement(a.text);
            renderAchievements();
        }
    });
}

function showAchievement(text) {
    const notif = document.getElementById('notification');
    notif.textContent = 'Achievement: ' + text;
    setTimeout(() => { notif.textContent = ''; }, 2500);
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    unlockedAchievements.forEach(id => {
        const a = achievements.find(x => x.id === id);
        if (a) {
            const li = document.createElement('li');
            li.textContent = a.text;
            list.appendChild(li);
        }
    });
}

// Пример состояния игры:
let state = {
    coins: 0,
    totalClicks: 0,
    upgrades: 0,
    boostersUsed: 0,
    autoclickersUsed: 0,
    dailyStreak: 0
    // ... другие поля, если есть
};

let boosterActive = false;
let boosterTimeout = null;
let boosterTimeLeft = 0;
let boosterInterval = null;

function setBoosterActive(active) {
    boosterActive = active;
    document.getElementById('booster-btn').disabled = active;
    if (active) {
        showNotification('Booster activated! x2 money for 30 sec');
    } else {
        showNotification('Booster ended');
    }
}

function updateBoosterTimerUI() {
    const el = document.getElementById('booster-timer');
    if (boosterTimeLeft > 0) {
        el.textContent = `Booster: ${boosterTimeLeft} sec.`;
    } else {
        el.textContent = '';
    }
}

// Клик по котику
const catImg = document.getElementById('cat-img');

catImg.addEventListener('click', function(e) {
    // Получаем координаты клика относительно картинки
    const rect = catImg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Определяем сторону: левая или правая половина
    if (x < rect.width / 2) {
        // Левая сторона — наклон влево
        catImg.style.transform = 'scale(0.96) rotate(-12deg)';
    } else {
        // Правая сторона — наклон вправо
        catImg.style.transform = 'scale(0.96) rotate(12deg)';
    }

    // Возвращаем кота в исходное положение через 120 мс
    setTimeout(() => {
        catImg.style.transform = '';
    }, 120);

    // Воспроизвести мяуканье, если включено
    if (meowEnabled && meowSound) {
        meowSound.currentTime = 0;
        meowSound.play();
    }
    // Вибрация (если поддерживается)
    if (vibrationEnabled && window.navigator.vibrate) {
        window.navigator.vibrate(50); // 50 мс вибрации
    }

    let reward = clickPower * (boosterActive ? 2 : 1) * comboMultiplier;
    if (currentPet === 'dragon') reward = Math.floor(reward * 1.2);
    if (currentPet === 'bird') reward = Math.floor(reward * 1.1);
    coins += reward;
    updateUI(); // Оптимизированное обновление UI
    gainXP(xpPerClick);
    catImg.classList.add('clicked');
    setTimeout(() => catImg.classList.remove('clicked'), 200);

    // ОПТИМИЗИРОВАННОЕ создание монетки
    const offsetX = e.offsetX || rect.width / 2;
    const offsetY = e.offsetY || rect.height / 2;
    createCoinElement(offsetX, offsetY, reward);

    // Шанс получить единорога при каждом клике!
    if (!ownedPets.unicorn && Math.random() < 1/2000) {
        ownedPets.unicorn = true;
        updatePetsCollection();
        showNotification('Congratulations! You got a rare pet: Unicorn 🦄');
    }

    state.totalClicks++;
    checkAchievements(state);
    checkSkinsAchievements();

    if (!comboTimeout) {
        comboCount = 0;
    }
    comboCount++;
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        if (comboCount >= 8) activateCombo();
        comboCount = 0;
    }, 2000);

    // Шанс получить дракона (1 к 5000)
    if (!ownedPets.dragon && Math.random() < 1/5000) {
        ownedPets.dragon = true;
        showNotification('✨ Amazing! You found a rare Dragon pet!');
        updatePetsCollection();
    }

    // Шанс получить феникса (1 к 3000)
    if (!ownedPets.phoenix && Math.random() < 1/3000) {
        ownedPets.phoenix = true;
        showNotification('🔥 Fantastic! A Phoenix has joined you!');
        updatePetsCollection();
    }

    if (currentPet) {
        createPetEffect(currentPet, e.clientX, e.clientY);
    }

    updateQuestProgress('click');

    rareEvents.forEach(event => {
        if (Math.random() < event.chance) event.action();
    });
});

// Улучшение клика
document.getElementById('upgrade-btn').onclick = function() {
    const price = getUpgradePrice();
    if (coins < price) return showNotification('Not enough money!');
    coins -= price;
    clickPower++;
    upgradeLevel++;
    updateShopUI();
    updateUI();
    showNotification('Click upgraded!');
};

function updateUpgradeButton() {
    document.getElementById('upgrade-btn').textContent = `Upgrade click (${getUpgradePrice()}🪙)`;
}

let autoclickTimer = null;
let autoclickTimeLeft = 0;
let autoclickTimerInterval = null;

function updateAutoclickTimerUI() {
    const timerDiv = document.getElementById('autoclick-timer');
    if (autoclick && autoclickTimeLeft > 0) {
        timerDiv.textContent = `Autoclicker: ${autoclickTimeLeft} sec.`;
    } else {
        timerDiv.textContent = '';
    }
}

// Автокликер на время
document.getElementById('autoclick-btn').onclick = autoSaveWrap(function() {
    if (coins < 50) return showNotification('Not enough money!');
    coins -= 50;
    autoclick = true;
    autoclickTimeLeft = 60; // сбрасываем таймер
    updateUI();
    updateAutoclickTimerUI(); // обязательно обновляем таймер на экране
    showNotification('Autoclicker activated for 60 seconds!');
    document.getElementById('autoclick-btn').disabled = true;

    // Если уже был автокликер — сбрасываем старый интервал
    if (window._autoclickerInterval) clearInterval(window._autoclickerInterval);

    // Запуск автокликера
    window._autoclickerInterval = setInterval(() => {
        coins += clickPower;
        updateUI();
        saveGame();
    }, 1000);

    // Запуск таймера автокликера
    if (window._autoclickerTimer) clearInterval(window._autoclickerTimer);
    window._autoclickerTimer = setInterval(() => {
        autoclickTimeLeft--;
        updateAutoclickTimerUI();
        if (autoclickTimeLeft <= 0) {
            clearInterval(window._autoclickerInterval);
            clearInterval(window._autoclickerTimer);
            autoclick = false;
            document.getElementById('autoclick-btn').disabled = false;
            updateAutoclickTimerUI();
            showNotification('Autoclicker ended!');
        }
    }, 1000);
});

// Магазин котиков
document.getElementById('buy-cat2').onclick = autoSaveWrap(function() {
    if (currentCat >= 2) return showNotification('Already purchased!');
    if (coins < 100) return showNotification('Not enough money!');
    coins -= 100;
    currentCat = 2;
    document.getElementById('cat-img').src = 'cat2.png';
    updateUI();
    showNotification('A new cat unlocked!');
});

// Донатный котик (заглушка)
document.getElementById('buy-cat3').onclick = autoSaveWrap(function() {
    showNotification('Available for donation only!');
});

// Бустер
document.getElementById('booster-btn').onclick = autoSaveWrap(function() {
    if (coins < 100) return showNotification('Not enough money!');
    coins -= 100;
    boosterActive = true;
    boosterTimeLeft = 30; // или сколько нужно секунд
    updateUI();
    updateBoosterTimerUI();
    showNotification('Booster x2 activated for 30 seconds!');
    document.getElementById('booster-btn').disabled = true;

    // Сбросить старый интервал, если был
    if (boosterInterval) clearInterval(boosterInterval);

    boosterInterval = setInterval(() => {
        boosterTimeLeft--;
        updateBoosterTimerUI();
        if (boosterTimeLeft <= 0) {
            clearInterval(boosterInterval);
            boosterActive = false;
            document.getElementById('booster-btn').disabled = false;
            updateBoosterTimerUI();
            showNotification('Booster ended!');
        }
    }, 1000);
});

// Скины
let ownedSkins = { default: true, gold: false, achieve: false };
let currentSkin = 'default';

function updateCatSkin() {
    let img = 'cat1.png';
    if (currentSkin === 'gold') img = 'cat_gold.png';
    if (currentSkin === 'achieve') img = 'cat_achieve.png';
    document.getElementById('cat-img').src = img;
}

// Покупка золотого скина
document.getElementById('skin-gold').onclick = autoSaveWrap(function() {
    if (ownedSkins.gold) {
        currentSkin = 'gold';
        updateCatSkin();
        showNotification('Golden cat selected!');
        return;
    }
    if (coins < 1000) return showNotification('Not enough money!');
    coins -= 1000;
    ownedSkins.gold = true;
    currentSkin = 'gold';
    updateUI();
    updateCatSkin();
    showNotification('Golden cat purchased and selected!');
});

// Обычный скин
document.getElementById('skin-default').onclick = autoSaveWrap(function() {
    currentSkin = 'default';
    updateCatSkin();
    showNotification('Default cat selected!');
});

// Скин за достижение
document.getElementById('skin-achieve').onclick = autoSaveWrap(function() {
    if (!ownedSkins.achieve) return showNotification('The skin will unlock after 100 clicks!');
    currentSkin = 'achieve';
    updateCatSkin();
    showNotification('Achievement skin selected!');
});

// Открытие скина за достижение
function checkSkinsAchievements() {
    if (state.totalClicks >= 100) ownedSkins.achieve = true;
}

// Питомцы
let ownedPets = { dog: false, bird: false, cat: false, unicorn: false, dragon: false, phoenix: false };
let currentPet = null;
let totalClicks = 0;
let phoenixBonuses = [
    { type: 'coins', amount: 50, text: "+50 coins from Phoenix!" },
    { type: 'multiplier', amount: 3, duration: 10, text: "Phoenix gift: x3 for 10 sec!" },
    { type: 'autoclick', duration: 30, text: "Phoenix gift: Autoclick for 30 sec!" }
];

function updatePetInfo() {
    let name = 'no';
    if (currentPet === 'dog') name = 'Dog';
    if (currentPet === 'bird') name = 'Bird';
    if (currentPet === 'cat') name = 'Cat';
    if (currentPet === 'unicorn') name = 'Unicorn';
    if (currentPet === 'dragon') name = 'Dragon';
    if (currentPet === 'phoenix') name = 'Phoenix';
    document.getElementById('current-pet').textContent = currentPet;
}

function updatePetImage() {
    const petImg = document.getElementById('pet-img');
    if (!currentPet || !ownedPets[currentPet] || currentPet === 'none') {
        petImg.style.display = 'none';
        return;
    }
    // Карта соответствия id питомца и картинки
    const petImages = {
        dog: 'pet_dog.png',
        bird: 'pet_bird.png',
        cat: 'pet_cat.png',
        unicorn: 'pet_unicorn.png',
        dragon: 'pet_dragon.png',
        phoenix: 'pet_phoenix.png'
    };
    petImg.src = petImages[currentPet] || '';
    petImg.alt = currentPet;
    petImg.style.display = 'block';
}

// Покупка собачки
document.getElementById('pet-dog').onclick = autoSaveWrap(function() {
    if (ownedPets.dog) {
        currentPet = 'dog';
        updatePetInfo();
        showNotification('Dog selected!');
        return;
    }
    if (coins < 500) return showNotification('Not enough money!');
    coins -= 500;
    ownedPets.dog = true;
    currentPet = 'dog';
    passiveIncome += 1;
    updateUI();
    updatePassiveUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Dog purchased and selected! +1 passive income');
});

// Покупка птички
document.getElementById('pet-bird').onclick = autoSaveWrap(function() {
    if (ownedPets.bird) {
        currentPet = 'bird';
        updatePetInfo();
        showNotification('Bird selected!');
        return;
    }
    if (coins < 800) return showNotification('Not enough money!');
    coins -= 800;
    ownedPets.bird = true;
    currentPet = 'bird';
    updateUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Bird purchased and selected! +10% to click');
});

// Покупка котёнка
document.getElementById('pet-cat').onclick = autoSaveWrap(function() {
    if (ownedPets.cat) {
        currentPet = 'cat';
        updatePetInfo();
        showNotification('Cat selected!');
        return;
    }
    if (coins < 1200) return showNotification('Not enough money!');
    coins -= 1200;
    ownedPets.cat = true;
    currentPet = 'cat';
    updateUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Cat purchased and selected! +5% to passive income');
});

// Дракон
document.getElementById('pet-dragon').onclick = autoSaveWrap(function() {
    if (!ownedPets.dragon) return showNotification('You need to find the Dragon first!');
    currentPet = 'dragon';
    updatePetInfo();
    updatePetImage();
    showNotification('Dragon selected! +20% to clicks');
});

// Феникс
document.getElementById('pet-phoenix').onclick = autoSaveWrap(function() {
    if (!ownedPets.phoenix) {
        showNotification('You need to unlock the Phoenix first!');
        updatePetInfo();
        updatePetImage();
        return;
    }
    currentPet = 'phoenix';
    updatePetInfo();
    updatePetImage();
    showNotification('Phoenix selected! Will grant random bonuses');
    startPhoenixBonuses(); // Запускаем систему бонусов
    saveGame();
});

// Снять питомца
document.getElementById('pet-none').onclick = autoSaveWrap(function() {
    currentPet = null;
    updatePetInfo();
    showNotification('The pet is cleaned up!');
});

// Модифицируйте начисление пассивного дохода:
setInterval(function() {
    let passive = passiveIncome;
    if (currentPet === 'cat') passive = Math.floor(passive * 1.05);
    if (currentPet === 'dog') passive += 1;
    if (currentPet === 'unicorn') passive += 5;
    if (passive > 0) {
        coins += passive;
        updateUI();
        saveGame();
    }
}, 1000);

// Шанс получить единорога — 1 к 2000 кликов
if (!ownedPets.unicorn && Math.random() < 1/10) {
    ownedPets.unicorn = true;
    updatePetsCollection();
    showNotification('Congratulations! You got a rare pet: Unicorn 🦄');
}

// Функция сохранения состояния
function saveGame() {
    const saveData = {
        coins,
        clickPower,
        autoclick,
        currentCat,
        xp,
        level,
        unlockedAchievements,
        state,
        passiveIncome, // добавлено
        ownedSkins,
        currentSkin,
        ownedPets,
        currentPet,
        passiveUpgradeCount,
        lastRewardDate, 
        streak,      
        petLevels
    };
    localStorage.setItem('catclickerSave', JSON.stringify(saveData));
}

// Функция загрузки состояния
function loadGame() {
    const data = localStorage.getItem('catclickerSave');
    if (data) {
        const save = JSON.parse(data);
        coins = save.coins ?? 0;
        clickPower = save.clickPower ?? 1;
        autoclick = save.autoclick ?? false;
        currentCat = save.currentCat ?? 1;
        xp = save.xp ?? 0;
        level = save.level ?? 1;
        unlockedAchievements = save.unlockedAchievements ?? [];
        Object.assign(state, save.state || {});
        passiveIncome = save.passiveIncome ?? 0;
        ownedSkins = save.ownedSkins ?? { default: true, gold: false, achieve: false };
        currentSkin = save.currentSkin ?? 'default';
        ownedPets = save.ownedPets ?? { dog: false, bird: false, cat: false, unicorn: false, dragon: false, phoenix: false };
        currentPet = save.currentPet ?? null;
        
        // Новые поля
        passiveUpgradeCount = save.passiveUpgradeCount || 0;
        lastRewardDate = save.lastRewardDate || null;
        streak = save.streak || 0;
        petLevels = save.petLevels || {};

        updateCatSkin();
        updatePetInfo();
        updatePetImage();
        // Восстановить котика
        document.getElementById('cat-img').src = `cat${currentCat}.png`;
        // Если автокликер был куплен — запустить его
        if (autoclick && !window._autoclickerStarted) {
            window._autoclickerStarted = true;
            setInterval(() => {
                coins += clickPower;
                updateUI();
                saveGame();
            }, 1000);
        }
    }
    updateUI();
    updateLevelUI();
    renderAchievements();
    updatePassiveUI();
    updatePetsCollection();
    checkDailyReward(); // Проверка ежедневной награды
}

// Сохранять игру при каждом действии
function autoSaveWrap(fn) {
    return function(...args) {
        const result = fn.apply(this, args);
        saveGame();
        return result;
    }
}

document.getElementById('upgrade-btn').onclick = function() {
    const price = getUpgradePrice();
    if (coins < price) return showNotification('Not enough money!');
    coins -= price;
    clickPower++;
    upgradeLevel++;
    updateShopUI();
    updateUI();
    showNotification('Click upgraded!');
};

document.getElementById('autoclick-btn').onclick = autoSaveWrap(function() {
    if (coins < 50) return showNotification('Not enough money!');
    coins -= 50;
    autoclick = true;
    autoclickTimeLeft = 60; // сбрасываем таймер
    updateUI();
    updateAutoclickTimerUI(); // обязательно обновляем таймер на экране
    showNotification('Autoclicker activated for 60 seconds!');
    document.getElementById('autoclick-btn').disabled = true;

    // Если уже был автокликер — сбрасываем старый интервал
    if (window._autoclickerInterval) clearInterval(window._autoclickerInterval);

    // Запуск автокликера
    window._autoclickerInterval = setInterval(() => {
        coins += clickPower;
        updateUI();
        saveGame();
    }, 1000);

    // Запуск таймера автокликера
    if (window._autoclickerTimer) clearInterval(window._autoclickerTimer);
    window._autoclickerTimer = setInterval(() => {
        autoclickTimeLeft--;
        updateAutoclickTimerUI();
        if (autoclickTimeLeft <= 0) {
            clearInterval(window._autoclickerInterval);
            clearInterval(window._autoclickerTimer);
            autoclick = false;
            document.getElementById('autoclick-btn').disabled = false;
            updateAutoclickTimerUI();
            showNotification('Autoclicker ended!');
        }
    }, 1000);
});

document.getElementById('buy-cat2').onclick = autoSaveWrap(function() {
    if (currentCat >= 2) return showNotification('Already purchased!');
    if (coins < 100) return showNotification('Not enough money!');
    coins -= 100;
    currentCat = 2;
    document.getElementById('cat-img').src = 'cat2.png';
    updateUI();
    showNotification('A new cat unlocked!');
});

document.getElementById('buy-cat3').onclick = autoSaveWrap(function() {
    showNotification('Available for donation only!');
});

document.getElementById('reset-btn').onclick = function() {
    if (!confirm('Are you sure you want to reset all progress?')) return;

    // Сброс всех переменных
    coins = 0;
    clickPower = 1;
    autoclick = false;
    currentCat = 1;
    xp = 0;
    level = 1;
    passiveIncome = 0;
    unlockedAchievements = [];
    state = {
        coins: 0,
        totalClicks: 0,
        upgrades: 0,
        boostersUsed: 0,
        autoclickersUsed: 0,
        dailyStreak: 0
    };
    boosterActive = false;
    ownedSkins = { default: true, gold: false, achieve: false };
    currentSkin = 'default';
    ownedPets = { dog: false, bird: false, cat: false, unicorn: false };
    currentPet = null;

    localStorage.clear();
    location.reload();
};

// Обновление UI пассивного дохода
function updatePassiveUI() {
    document.getElementById('passive-value').textContent = passiveIncome;
}

// Улучшение пассивного дохода
document.getElementById('passive-btn').onclick = autoSaveWrap(function() {
    const price = getPassivePrice();
    if (coins < price) return showNotification('Not enough money!');
    coins -= price;
    passiveIncome += 0.5; // Уменьшил прирост
    passiveUpgradeCount++;
    updateUI();
    updatePassiveUI();
    showNotification('Passive income upgraded!');
});

// Пассивное начисление монет каждую секунду
setInterval(function() {
    if (passiveIncome > 0) {
        coins += passiveIncome;
        updateUI();
        saveGame();
    }
}, 1000);

// Загрузка игры при запуске
loadGame();

// --- Telegram Mini App Support ---
if (window.Telegram && Telegram.WebApp) {
    const tg = Telegram.WebApp;
    tg.ready(); // Инициализация Telegram Web App
    tg.expand(); // Открыть на весь экран

    // Получаем информацию о пользователе
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        console.log("Welcome", user.first_name);
        showNotification(`Welcome, ${user.first_name}! 🐾`);
    }

    // Показываем нижнюю кнопку Telegram
    tg.MainButton.setText("Buy Booster x2 (100🪙)").show();
    tg.MainButton.onClick(() => {
        const btn = document.getElementById('booster-btn');
        if (btn && !btn.disabled) btn.click();
    });

    // Назад — закрыть настройки
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        document.getElementById('settings-modal').style.display = 'none';
    });
}

// Сначала объявите функцию
function updatePetsCollection() {
    document.getElementById('coll-dog').style.opacity = ownedPets.dog ? '1' : '0.3';
    document.getElementById('coll-bird').style.opacity = ownedPets.bird ? '1' : '0.3';
    document.getElementById('coll-cat').style.opacity = ownedPets.cat ? '1' : '0.3';
    document.getElementById('coll-unicorn').style.opacity = ownedPets.unicorn ? '1' : '0.3';
    document.getElementById('coll-dragon').style.opacity = ownedPets.dragon ? '1' : '0.3';
    document.getElementById('coll-phoenix').style.opacity = ownedPets.phoenix ? '1' : '0.3';

// Добавим дракона и феникса в коллекцию
    if (!document.getElementById('coll-dragon')) {
        const collection = document.getElementById('collection-list');
        collection.innerHTML += `
            <img src="pet_dragon.png" alt="Dragon" id="coll-dragon" style="width:40px;opacity:0.3;">
            <img src="pet_phoenix.png" alt="Phoenix" id="coll-phoenix" style="width:40px;opacity:0.3;">
        `;
    }

    // Награда за полную коллекцию
    const rewardDiv = document.getElementById('collection-reward');
    if (ownedPets.dog && ownedPets.bird && ownedPets.cat && ownedPets.unicorn && ownedPets.dragon && ownedPets.phoenix) {
        rewardDiv.textContent = 'The collection is complete! Bonus: +2 to passive income.';
        if (!window._collectionRewardGiven) {
            passiveIncome += 2;
            updatePassiveUI();
            window._collectionRewardGiven = true;
            showNotification('Bonus for collection: +2 to passive income!');
            saveGame();
        }
    } else {
        rewardDiv.textContent = '';
        window._collectionRewardGiven = false;
    }  
}

// Навигация по вкладкам
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = function() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
        document.getElementById('tab-' + tab).style.display = 'block';

        // Новый звук переключения вкладок
        if (buttonSound) {
            buttonSound.currentTime = 0;
            buttonSound.play();
        }

        // Telegram вибро-отдача
        if (Telegram.WebApp && Telegram.WebApp.HapticFeedback) {
            Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
    }
});
// По умолчанию показываем первую вкладку
document.querySelector('.nav-btn[data-tab="game"]').classList.add('active');
document.getElementById('tab-game').style.display = 'block';

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

// Покупка/выбор единорога
document.getElementById('pet-unicorn').onclick = autoSaveWrap(function() {
    if (!ownedPets.unicorn) return showNotification('First, get the unicorn!');
    currentPet = 'unicorn';
    updatePetInfo();
    updatePetImage();
    updatePassiveUI();
    updateUI();
    updatePetsCollection();
    showNotification('Unicorn selected! +5 to passive income');
});

function fullUpdateUI() {
    updateUI();
    updatePetInfo && updatePetInfo();
    updatePetImage && updatePetImage();
    updatePassiveUI && updatePassiveUI();
    updateCatSkin && updateCatSkin();
    renderPets && renderPets();
    renderSkins && renderSkins();
    renderShop && renderShop();
    renderAchievements && renderAchievements();
}

// Звук мяуканья
const meowSound = document.getElementById('meow-sound');
const buttonSound = document.getElementById('button-sound');
let meowEnabled = true;

// Открытие настроек
document.getElementById('settings-btn').onclick = function() {
    document.getElementById('settings-modal').style.display = 'flex';
    document.getElementById('meow-toggle').checked = meowEnabled;
};

// Закрытие настроек
document.getElementById('close-settings').onclick = function() {
    document.getElementById('settings-modal').style.display = 'none';
};

// Переключатель звука
document.getElementById('meow-toggle').onchange = function() {
    meowEnabled = this.checked;
};

// Воспроизведение звука только если включено
document.getElementById('cat-img').addEventListener('click', function() {
    // Воспроизвести мяуканье, если включено
    if (meowEnabled && meowSound) {
        meowSound.currentTime = 0;
        meowSound.play();
    }
    // Вибрация (если поддерживается)
    if (vibrationEnabled && window.navigator.vibrate) {
        window.navigator.vibrate(50); // 50 мс вибрации
    }
    // ...остальной код клика...
});

let vibrationEnabled = true;
document.getElementById('vibration-toggle').onchange = function() {
    vibrationEnabled = this.checked;
};

// Например, если у вас есть переменная upgradeLevel:
function updateShopUI() {
    document.getElementById('click-level').textContent = upgradeLevel;
    // обновите цену на кнопке
    document.getElementById('upgrade-btn').textContent = `Upgrade click (${getUpgradePrice()}🪙)`;
    // ...обновите другие значения, если нужно...
}

// Новая функция активации комбо
function activateCombo() {
    const newMultiplier = 2 + Math.min(3, Math.floor(comboCount/5));
    comboMultiplier = boosterActive ? newMultiplier * 2 : newMultiplier;
    
    showNotification(`COMBO x${comboMultiplier}! Keep going!`);
    document.getElementById('cat-img').classList.add('combo-effect');
    
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        comboMultiplier = 1;
        document.getElementById('cat-img').classList.remove('combo-effect');
    }, 5000);
}

// Запуск мини-игры каждые 5 минут
setInterval(() => {
    if (!fishingGameActive && Math.random() < 0.3) { // 30% шанс появления
        startFishingGame();
    }
}, 5 * 60 * 1000);

function startFishingGame() {
    fishingGameActive = true;
    fishingScore = 0;
    document.getElementById('fishing-game').style.display = 'block';
    const fishingArea = document.getElementById('fishing-area');
    fishingArea.innerHTML = '';
    
    let timeLeft = 30;
    document.getElementById('fishing-timer').textContent = timeLeft;
    
    // Таймер
    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('fishing-timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endFishingGame();
        }
    }, 1000);
    
    // Создаем рыбок
    fishingInterval = setInterval(() => {
        if (timeLeft > 0) {
            createFish();
        }
    }, 800);
}

function createFish() {
    const fish = document.createElement('div');
    fish.innerHTML = '🐟';
    fish.style.position = 'absolute';
    fish.style.fontSize = '40px';
    fish.style.left = Math.random() * 80 + '%';
    fish.style.top = Math.random() * 70 + '%';
    fish.style.cursor = 'pointer';
    fish.onclick = function() {
        fishingScore += 10;
        coins += 10;
        updateUI();
        this.remove();
        showNotification('+10 coins!');
    };
    document.getElementById('fishing-area').appendChild(fish);
    
    setTimeout(() => fish.remove(), 2000);
}

function endFishingGame() {
    clearInterval(fishingInterval);
    fishingGameActive = false;
    showNotification(`Fishing game over! Total: ${fishingScore} coins`);
    document.getElementById('fishing-game').style.display = 'none';
}

document.getElementById('close-fishing').onclick = endFishingGame;

// Случайный запуск игры
setInterval(() => {
    if (!jumpGameActive && Math.random() < 0.9) {
        startJumpGame();
    }
}, 1 * 60 * 1000); // Каждые 8 минут

function startJumpGame() {
    jumpGameActive = true;
    jumpScore = 0;
    document.getElementById('jump-game').style.display = 'block';
    document.getElementById('jump-score').textContent = '0';
    isJumping = false;
    obstaclePosition = 0;
    
    const obstacle = document.getElementById('jump-obstacle');
    obstacle.style.right = '-30px';
    
    jumpInterval = setInterval(updateJumpGame, 40);
}

function updateJumpGame() {
    const cat = document.getElementById('cat-jumper');
    const obstacle = document.getElementById('jump-obstacle');
    
    // Движение препятствия
    obstaclePosition += 4;
    obstacle.style.right = `${obstaclePosition}px`;
    
    // Проверка столкновения
    const catRect = document.getElementById('cat-jumper').getBoundingClientRect();
    const obstacleRect = document.getElementById('jump-obstacle').getBoundingClientRect();
    
    if (Math.abs(catRect.right - obstacleRect.left) < 30 && 
        Math.abs(catRect.bottom - obstacleRect.bottom) < 40 &&
        !isJumping) {
        endJumpGame(false);
    }
    
    // Если препятствие ушло за экран
    if (obstaclePosition > 300) {
        jumpScore += 10;
        document.getElementById('jump-score').textContent = jumpScore;
        obstaclePosition = -30;
    }
}

// Обработчик клика для прыжка
document.getElementById('jump-scene').onclick = function() {
    if (!isJumping) {
        isJumping = true;
        const cat = document.getElementById('cat-jumper');
        cat.style.bottom = '100px';
        
        setTimeout(() => {
            cat.style.bottom = '0';
            setTimeout(() => {
                isJumping = false;
            }, 300);
        }, 500);
    }
};

function endJumpGame(success) {
    clearInterval(jumpInterval);
    jumpGameActive = false;
    document.getElementById('jump-game').style.display = 'none';
    
    if (success) {
        coins += jumpScore * 2;
        updateUI();
        showNotification(`Great! Earned ${jumpScore * 2} coins!`);
    } else {
        coins += Math.floor(jumpScore / 2);
        updateUI();
        showNotification(`Game over! Earned ${Math.floor(jumpScore / 2)} coins.`);
    }
}

document.getElementById('close-jump').onclick = () => endJumpGame(true);

setInterval(() => {
    if (currentPet === 'phoenix' && Math.random() < 0.3) { // 30% шанс каждые 5 минут
        const bonus = phoenixBonuses[Math.floor(Math.random() * phoenixBonuses.length)];
        applyPhoenixBonus(bonus);
    }
}, 5 * 60 * 1000); // Каждые 5 минут

function applyPhoenixBonus(bonus) {
    showNotification(bonus.text);
    
    switch(bonus.type) {
        case 'coins':
            coins += bonus.amount;
            updateUI();
            break;
        case 'multiplier':
            const oldMultiplier = clickPower;
            clickPower *= bonus.amount;
            setTimeout(() => {
                clickPower = oldMultiplier;
                showNotification("Phoenix multiplier ended");
            }, bonus.duration * 1000);
            break;
        case 'autoclick':
            if (!autoclick) {
                autoclickTimeLeft = bonus.duration;
                updateAutoclickTimerUI();
                const interval = setInterval(() => {
                    coins += clickPower;
                    updateUI();
                }, 1000);
                setTimeout(() => {
                    clearInterval(interval);
                    autoclick = false;
                }, bonus.duration * 1000);
            }
            break;
    }
    
    // Визуальный эффект
    const effect = document.createElement('div');
    effect.className = 'phoenix-effect';
    effect.textContent = '🔥';
    document.getElementById('cat-area').appendChild(effect);
    setTimeout(() => effect.remove(), 2000);
}

// Инициализация квестов
const quests = [
    { id: 'click50', text: 'Make 50 clicks', target: 50, progress: 0, completed: false, reward: 100 },
    { id: 'earn500', text: 'Earn 500 coins', target: 500, progress: 0, completed: false, reward: 200 },
    { id: 'upgrade5', text: 'Buy 5 upgrades', target: 5, progress: 0, completed: false, reward: 300 }
];
let completedQuestsToday = 0;

function initQuests() {
    const today = new Date().toDateString();
    const savedQuests = JSON.parse(localStorage.getItem('catQuests') || '{}');
    
    if (savedQuests.date === today) {
        quests.forEach((q, i) => {
            if (savedQuests.quests[i]) {
                q.progress = savedQuests.quests[i].progress;
                q.completed = savedQuests.quests[i].completed;
            }
        });
    }
    renderQuests();
}

// Отрисовка квестов
function renderQuests() {
    const list = document.getElementById('quests-list');
    list.innerHTML = '';
    
    quests.forEach(quest => {
        const li = document.createElement('li');
        li.style.margin = '10px 0';
        li.style.padding = '10px';
        li.style.background = '#f5f5f5';
        li.style.borderRadius = '8px';
        
        li.innerHTML = `
            <div style="font-weight:${quest.completed ? 'bold' : 'normal'}">
                ${quest.text} (${quest.progress}/${quest.target})
            </div>
            <div>Reward: ${quest.reward}🪙</div>
            ${quest.completed ? '<div style="color:#4CAF50;">Completed!</div>' : ''}
        `;
        
        list.appendChild(li);
    });
    
    updateQuestButton();
}

// Проверка выполнения квестов
function checkQuests() {
    let anyCompleted = false;
    
    quests.forEach(quest => {
        if (!quest.completed && quest.progress >= quest.target) {
            quest.completed = true;
            anyCompleted = true;
            completedQuestsToday++;
        }
    });
    
    if (anyCompleted) {
        renderQuests();
        showNotification('Quest completed! Claim your reward.');
    }
    
    saveQuests();
}

// Обновление прогресса квестов
function updateQuestProgress(type, amount = 1) {
    quests.forEach(quest => {
        if (quest.completed) return;
        
        if (type === 'click' && quest.id.includes('click')) {
            quest.progress += amount;
        } else if (type === 'earn' && quest.id.includes('earn')) {
            quest.progress = Math.min(quest.progress + amount, quest.target);
        } else if (type === 'upgrade' && quest.id.includes('upgrade')) {
            quest.progress += amount;
        }
    });
    
    checkQuests();
}

// При получении монет:
function addCoins(amount) {
    coins += amount;
    updateQuestProgress('earn', amount);
    updateUI();
}

// При покупке улучшения:
updateQuestProgress('upgrade');

// Кнопка получения награды
document.getElementById('claim-reward').onclick = function() {
    let totalReward = 0;
    
    quests.forEach(quest => {
        if (quest.completed && !quest.rewardClaimed) {
            totalReward += quest.reward;
            quest.rewardClaimed = true;
        }
    });
    
    if (totalReward > 0) {
        coins += totalReward;
        updateUI();
        showNotification(`Claimed ${totalReward} coins from quests!`);
        renderQuests();
    }
};

function updateQuestButton() {
    const btn = document.getElementById('claim-reward');
    const hasRewards = quests.some(q => q.completed && !q.rewardClaimed);
    btn.disabled = !hasRewards;
}

function saveQuests() {
    const today = new Date().toDateString();
    localStorage.setItem('catQuests', JSON.stringify({
        date: today,
        quests: quests
    }));
}

// Инициализация при загрузке
initQuests();

// Новая функция для эффектов
function createPetEffect(petType, x, y) {
    const effect = document.createElement('div');
    effect.style.position = 'fixed';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    switch(petType) {
        case 'dog':
            effect.className = 'paw-effect';
            setTimeout(() => effect.remove(), 1000);
            break;
        case 'unicorn':
            effect.className = 'unicorn-aura';
            effect.style.left = `${x-50}px`;
            effect.style.top = `${y-50}px`;
            setTimeout(() => effect.remove(), 3000);
            break;
        case 'dragon':
            effect.className = 'dragon-effect';
            effect.textContent = '🐉';
            setTimeout(() => effect.remove(), 2000);
            break;
        case 'phoenix':
            effect.className = 'phoenix-effect';
            effect.textContent = '🔥';
            setTimeout(() => effect.remove(), 2000);
            break;
        default:
            return;
    }
    
    document.body.appendChild(effect);
}

function checkDailyReward() {
    const today = new Date().toDateString();
    if (lastRewardDate === today) return;
    
    if (!lastRewardDate || isConsecutiveDay(new Date(lastRewardDate), new Date())) {
        streak = Math.min(7, streak + 1);
    } else {
        streak = 1;
    }
    
    const reward = dailyRewards[streak - 1];
    coins += reward;
    lastRewardDate = today;
    showNotification(`Daily reward: ${reward} coins! Streak: ${streak}/7`);
    saveGame();
}



// Система редких событий
const rareEvents = [
    { 
        name: "Meteor Shower", 
        chance: 0.002, 
        action: () => {
            showNotification("Meteor shower! +500 coins!");
            coins += 500;
        }
    },
    {
        name: "Lucky Cat",
        chance: 0.005,
        action: () => {
            showNotification("Lucky cat visited! 2x coins for 20s");
            const originalPower = clickPower;
            clickPower *= 2;
            setTimeout(() => clickPower = originalPower, 20000);
        }
    }
];

// Система прокачки питомцев
function levelUpPet(petType) {
    if (!petLevels[petType]) petLevels[petType] = 1;
    else petLevels[petType]++;
    
    showNotification(`${petType} leveled up! Now level ${petLevels[petType]}`);
    
    // Добавляем бонусы за уровни
    switch(petType) {
        case 'dog':
            passiveIncome += 0.2;
            break;
        case 'bird':
            clickPower += 0.1;
            break;
        case 'cat':
            passiveIncome += 0.3;
            break;
    }
    updatePassiveUI();
}

function isConsecutiveDay(prevDate, currentDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.abs(currentDate - prevDate) < 2 * oneDay;
}
