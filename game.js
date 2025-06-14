let coins = 0;
let clickPower = 1;
let autoclick = false;
let currentCat = 1;
let xp = 0;
let level = 1;
let passiveIncome = 0;
const xpPerClick = 1;
const xpToNextLevel = () => 10 + (level - 1) * 10;

const achievements = [
    { id: 'firstClick', text: 'Первый клик!', condition: (state) => state.totalClicks >= 1 },
    { id: 'hundredClicks', text: '100 кликов!', condition: (state) => state.totalClicks >= 100 },
    { id: 'firstUpgrade', text: 'Первое улучшение!', condition: (state) => state.upgrades >= 1 },
    { id: 'richCat', text: '1000 монет!', condition: (state) => state.coins >= 1000 },
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
    notif.textContent = 'Достижение: ' + text;
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
    // ...другие параметры...
};

let boosterActive = false;
let boosterTimeout = null;

function setBoosterActive(active) {
    boosterActive = active;
    document.getElementById('booster-btn').disabled = active;
    if (active) {
        showNotification('Бустер активирован! x2 монеты на 30 сек');
    } else {
        showNotification('Бустер закончился');
    }
}

// Клик по котику
const catImg = document.getElementById('cat-img');
catImg.addEventListener('click', autoSaveWrap(function(e) {
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
        showNotification('Поздравляем! Вам выпал редкий питомец: Единорог 🦄');
    }

    state.totalClicks++;
    checkAchievements(state);
    checkSkinsAchievements();
}));

// Улучшение клика
document.getElementById('upgrade-btn').onclick = autoSaveWrap(function() {
    if (coins < 10) return showNotification('Недостаточно монет!');
    coins -= 10;
    clickPower++;
    updateUI();
    showNotification('Клик улучшен! +' + clickPower + ' за клик');

    state.upgrades++;
    checkAchievements(state);
});

let autoclickTimer = null;
let autoclickTimeLeft = 0;
let autoclickTimerInterval = null;

function updateAutoclickTimerUI() {
    const timerDiv = document.getElementById('autoclick-timer');
    if (autoclick && autoclickTimeLeft > 0) {
        timerDiv.textContent = `Автокликер: ${autoclickTimeLeft} сек.`;
    } else {
        timerDiv.textContent = '';
    }
}

// Автокликер на время
document.getElementById('autoclick-btn').onclick = autoSaveWrap(function() {
    if (autoclick) return showNotification('Автокликер уже активен!');
    if (coins < 50) return showNotification('Недостаточно монет!');
    coins -= 50;
    autoclick = true;
    autoclickTimeLeft = 60;
    updateUI();
    updateAutoclickTimerUI();
    showNotification('Автокликер активирован на 60 секунд!');
    document.getElementById('autoclick-btn').disabled = true;

    // Запуск автокликера
    window._autoclickerInterval = setInterval(() => {
        coins += clickPower;
        updateUI();
        saveGame();
    }, 1000);

    // Запуск таймера отображения
    autoclickTimerInterval = setInterval(() => {
        autoclickTimeLeft--;
        updateAutoclickTimerUI();
        if (autoclickTimeLeft <= 0) {
            clearInterval(window._autoclickerInterval);
            clearInterval(autoclickTimerInterval);
            autoclick = false;
            document.getElementById('autoclick-btn').disabled = false;
            updateAutoclickTimerUI();
            showNotification('Автокликер отключён!');
            saveGame();
        }
    }, 1000);
});

// Магазин котиков
document.getElementById('buy-cat2').onclick = autoSaveWrap(function() {
    if (currentCat >= 2) return showNotification('Уже куплено!');
    if (coins < 100) return showNotification('Недостаточно монет!');
    coins -= 100;
    currentCat = 2;
    document.getElementById('cat-img').src = 'cat2.png';
    updateUI();
    showNotification('Открыт новый котик!');
});

// Донатный котик (заглушка)
document.getElementById('buy-cat3').onclick = autoSaveWrap(function() {
    showNotification('Доступно только за донат!');
});

// Бустер
document.getElementById('booster-btn').onclick = autoSaveWrap(function() {
    if (boosterActive) return showNotification('Бустер уже активен!');
    if (coins < 20) return showNotification('Недостаточно монет!');
    coins -= 20;
    setBoosterActive(true);
    updateUI();
    boosterTimeout = setTimeout(() => setBoosterActive(false), 30000);
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
        showNotification('Золотой котик выбран!');
        return;
    }
    if (coins < 1000) return showNotification('Недостаточно монет!');
    coins -= 1000;
    ownedSkins.gold = true;
    currentSkin = 'gold';
    updateUI();
    updateCatSkin();
    showNotification('Золотой котик куплен и выбран!');
});

// Обычный скин
document.getElementById('skin-default').onclick = autoSaveWrap(function() {
    currentSkin = 'default';
    updateCatSkin();
    showNotification('Обычный котик выбран!');
});

// Скин за достижение
document.getElementById('skin-achieve').onclick = autoSaveWrap(function() {
    if (!ownedSkins.achieve) return showNotification('Скин откроется после 100 кликов!');
    currentSkin = 'achieve';
    updateCatSkin();
    showNotification('Достижение-скин выбран!');
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
    document.getElementById('current-pet').textContent = name;
}

function updatePetImage() {
    const petImg = document.getElementById('pet-img');
    if (currentPet === 'dog') {
        petImg.src = 'pet_dog.png';
        petImg.alt = 'Dog';
        petImg.style.display = '';
    } else if (currentPet === 'bird') {
        petImg.src = 'pet_bird.png';
        petImg.alt = 'Bird';
        petImg.style.display = '';
    } else if (currentPet === 'cat') {
        petImg.src = 'pet_cat.png';
        petImg.alt = 'Cat';
        petImg.style.display = '';
    } else if (currentPet === 'unicorn') {
        petImg.src = 'pet_unicorn.png';
        petImg.alt = 'Unicorn';
        petImg.style.display = '';
    } else {
        petImg.style.display = 'none';
    }
}

// Покупка собачки
document.getElementById('pet-dog').onclick = autoSaveWrap(function() {
    if (ownedPets.dog) {
        currentPet = 'dog';
        updatePetInfo();
        showNotification('Собачка выбрана!');
        return;
    }
    if (coins < 500) return showNotification('Недостаточно монет!');
    coins -= 500;
    ownedPets.dog = true;
    currentPet = 'dog';
    passiveIncome += 1;
    updateUI();
    updatePassiveUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Собачка куплена и выбрана! +1 пассивный доход');
});

// Покупка птички
document.getElementById('pet-bird').onclick = autoSaveWrap(function() {
    if (ownedPets.bird) {
        currentPet = 'bird';
        updatePetInfo();
        showNotification('Птичка выбрана!');
        return;
    }
    if (coins < 800) return showNotification('Недостаточно монет!');
    coins -= 800;
    ownedPets.bird = true;
    currentPet = 'bird';
    updateUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Птичка куплена и выбрана! +10% к клику');
});

// Покупка котёнка
document.getElementById('pet-cat').onclick = autoSaveWrap(function() {
    if (ownedPets.cat) {
        currentPet = 'cat';
        updatePetInfo();
        showNotification('Котёнок выбран!');
        return;
    }
    if (coins < 1200) return showNotification('Недостаточно монет!');
    coins -= 1200;
    ownedPets.cat = true;
    currentPet = 'cat';
    updateUI();
    updatePetInfo();
    updatePetImage();
    showNotification('Котёнок куплен и выбран! +5% к пассивному доходу');
});

// Снять питомца
document.getElementById('pet-none').onclick = autoSaveWrap(function() {
    currentPet = null;
    updatePetInfo();
    showNotification('Питомец снят!');
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
    showNotification('Поздравляем! Вам выпал редкий питомец: Единорог 🦄');
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

function updateDailyBonusBar() {
    const now = Date.now();
    const lastBonus = Number(localStorage.getItem('catclickerLastBonus') || 0);
    const msInDay = 86400000;
    const elapsed = now - lastBonus;
    let percent = Math.min(100, (elapsed / msInDay) * 100);
    document.getElementById('daily-bonus-progress').style.width = percent + '%';

    let timerDiv = document.getElementById('daily-bonus-timer');
    if (elapsed >= msInDay) {
        timerDiv.textContent = 'Бонус доступен!';
    } else {
        const left = msInDay - elapsed;
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        const s = Math.floor((left % 60000) / 1000);
        timerDiv.textContent = `До бонуса: ${h}ч ${m}м ${s}с`;
    }
}

function giveDailyBonus() {
    const now = Date.now();
    const lastBonus = Number(localStorage.getItem('catclickerLastBonus') || 0);
    const msInDay = 86400000;
    if (now - lastBonus > msInDay) {
        const bonus = 50 + Math.floor(Math.random() * 51); // 50-100 монет
        coins += bonus;
        updateUI();
        showNotification(`Ежедневный бонус: +${bonus} монет!`);
        localStorage.setItem('catclickerLastBonus', now);
        saveGame();
    }
    updateDailyBonusBar();
    setInterval(updateDailyBonusBar, 1000);
}

// Сохранять игру при каждом действии
function autoSaveWrap(fn) {
    return function(...args) {
        const result = fn.apply(this, args);
        saveGame();
        return result;
    }
}

document.getElementById('upgrade-btn').onclick = autoSaveWrap(function() {
    if (coins < 10) return showNotification('Недостаточно монет!');
    coins -= 10;
    clickPower++;
    updateUI();
    showNotification('Клик улучшен! +' + clickPower + ' за клик');

    state.upgrades++;
    checkAchievements(state);
});

document.getElementById('autoclick-btn').onclick = autoSaveWrap(function() {
    if (autoclick) return showNotification('Автокликер уже активен!');
    if (coins < 50) return showNotification('Недостаточно монет!');
    coins -= 50;
    autoclick = true;
    autoclickTimeLeft = 60;
    updateUI();
    updateAutoclickTimerUI();
    showNotification('Автокликер активирован на 60 секунд!');
    document.getElementById('autoclick-btn').disabled = true;

    // Запуск автокликера
    window._autoclickerInterval = setInterval(() => {
        coins += clickPower;
        updateUI();
        saveGame();
    }, 1000);

    // Запуск таймера отображения
    autoclickTimerInterval = setInterval(() => {
        autoclickTimeLeft--;
        updateAutoclickTimerUI();
        if (autoclickTimeLeft <= 0) {
            clearInterval(window._autoclickerInterval);
            clearInterval(autoclickTimerInterval);
            autoclick = false;
            document.getElementById('autoclick-btn').disabled = false;
            updateAutoclickTimerUI();
            showNotification('Автокликер отключён!');
            saveGame();
        }
    }, 1000);
});

document.getElementById('buy-cat2').onclick = autoSaveWrap(function() {
    if (currentCat >= 2) return showNotification('Уже куплено!');
    if (coins < 100) return showNotification('Недостаточно монет!');
    coins -= 100;
    currentCat = 2;
    document.getElementById('cat-img').src = 'cat2.png';
    updateUI();
    showNotification('Открыт новый котик!');
});

document.getElementById('buy-cat3').onclick = autoSaveWrap(function() {
    showNotification('Доступно только за донат!');
});

document.getElementById('reset-btn').onclick = function() {
    if (!confirm('Вы уверены, что хотите сбросить весь прогресс?')) return;

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
    if (coins < 25) return showNotification('Недостаточно монет!');
    coins -= 25;
    passiveIncome++;
    updateUI();
    updatePassiveUI();
    showNotification('Пассивный доход увеличен!');
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
giveDailyBonus();

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    // Можно использовать Telegram.WebApp.initData, Telegram.WebApp.sendData и т.д.
}

function updatePetsCollection() {
    document.getElementById('coll-dog').style.opacity = ownedPets.dog ? '1' : '0.3';
    document.getElementById('coll-bird').style.opacity = ownedPets.bird ? '1' : '0.3';
    document.getElementById('coll-cat').style.opacity = ownedPets.cat ? '1' : '0.3';
    document.getElementById('coll-unicorn').style.opacity = ownedPets.unicorn ? '1' : '0.3';

    // Награда за полную коллекцию
    const rewardDiv = document.getElementById('collection-reward');
    if (ownedPets.dog && ownedPets.bird && ownedPets.cat) {
        rewardDiv.textContent = 'Коллекция собрана! Бонус: +2 к пассивному доходу';
        if (!window._collectionRewardGiven) {
            passiveIncome += 2;
            updatePassiveUI();
            window._collectionRewardGiven = true;
            showNotification('Бонус за коллекцию: +2 к пассивному доходу!');
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
    if (!ownedPets.unicorn) return showNotification('Сначала получите единорога!');
    currentPet = 'unicorn';
    updatePetInfo();
    updatePetImage();
    updatePassiveUI();
    updateUI();
    updatePetsCollection();
    showNotification('Единорог выбран! +5 к пассивному доходу');
});