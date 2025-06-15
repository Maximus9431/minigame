let coins = 0;
let clickPower = 1;
let autoclick = false;
let currentCat = 1;
let xp = 0;
let level = 1;
let passiveIncome = 0;
let upgradeLevel = 1; // уровень клика
const xpPerClick = 1;
const xpToNextLevel = () => 10 + (level - 1) * 10;

function getUpgradePrice() {
    return Math.floor(10 * Math.pow(1.5, upgradeLevel - 1));
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

    let reward = clickPower;
    if (boosterActive) reward *= 2;
    if (currentPet === 'bird') reward = Math.floor(reward * 1.1);
    coins += reward;
    updateUI();
    gainXP(xpPerClick);
    catImg.classList.add('clicked');
    setTimeout(() => catImg.classList.remove('clicked'), 200);

    // Всплывающая монетка
    const coin = document.createElement('div');
    coin.textContent = `+${reward}`;
    coin.className = 'coin-float';
    coin.style.left = (e.offsetX || 50) + 'px';
    coin.style.top = (e.offsetY || 50) + 'px';
    document.getElementById('cat-area').appendChild(coin);
    setTimeout(() => coin.remove(), 700);

    // Шанс получить единорога при каждом клике!
    if (!ownedPets.unicorn && Math.random() < 1/10) { // 1 к 10 — можно изменить шанс
        ownedPets.unicorn = true;
        updatePetsCollection();
        showNotification('Congratulations! You got a rare pet: Unicorn 🦄');
    }

    state.totalClicks++;
    checkAchievements(state);
    checkSkinsAchievements();
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
let ownedPets = { dog: false, bird: false, cat: false, unicorn: false };
let currentPet = null;

function updatePetInfo() {
    let name = 'no';
    if (currentPet === 'dog') name = 'Dog';
    if (currentPet === 'bird') name = 'Bird';
    if (currentPet === 'cat') name = 'Cat';
    if (currentPet === 'unicorn') name = 'Unicorn';
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
        unicorn: 'pet_unicorn.png'
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
        currentPet
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
        passiveIncome = save.passiveIncome ?? 0; // добавлено
        ownedSkins = save.ownedSkins ?? { default: true, gold: false, achieve: false };
        currentSkin = save.currentSkin ?? 'default';
        ownedPets = save.ownedPets ?? { dog: false, bird: false, cat: false, unicorn: false };
        currentPet = save.currentPet ?? null;
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
    updatePassiveUI(); // добавлено
    updatePetsCollection();
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
    if (coins < 25) return showNotification('Not enough money!');
    coins -= 25;
    passiveIncome++;
    updateUI();
    updatePassiveUI();
    showNotification('Passive income has increased!');
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

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand(); // Открыть WebApp на весь экран
}

// Сначала объявите функцию
function updatePetsCollection() {
    document.getElementById('coll-dog').style.opacity = ownedPets.dog ? '1' : '0.3';
    document.getElementById('coll-bird').style.opacity = ownedPets.bird ? '1' : '0.3';
    document.getElementById('coll-cat').style.opacity = ownedPets.cat ? '1' : '0.3';
    document.getElementById('coll-unicorn').style.opacity = ownedPets.unicorn ? '1' : '0.3';

    // Награда за полную коллекцию
    const rewardDiv = document.getElementById('collection-reward');
    if (ownedPets.dog && ownedPets.bird && ownedPets.cat) {
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