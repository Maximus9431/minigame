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
    coins += reward;
    updateUI();
    gainXP(xpPerClick);
    catImg.classList.add('clicked');
    setTimeout(() => catImg.classList.remove('clicked'), 200);

    // Всплывающая монетка
    const coin = document.createElement('div');
    coin.textContent = boosterActive ? `+${reward}` : '+1';
    coin.className = 'coin-float';
    coin.style.left = (e.offsetX || 50) + 'px';
    coin.style.top = (e.offsetY || 50) + 'px';
    document.getElementById('cat-area').appendChild(coin);
    setTimeout(() => coin.remove(), 700);

    state.totalClicks++;
    checkAchievements(state);
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

// Автокликер
document.getElementById('autoclick-btn').onclick = autoSaveWrap(function() {
    if (autoclick) return showNotification('Уже куплено!');
    if (coins < 50) return showNotification('Недостаточно монет!');
    coins -= 50;
    autoclick = true;
    updateUI();
    showNotification('Автокликер активирован!');
    if (!window._autoclickerStarted) {
        window._autoclickerStarted = true;
        setInterval(() => {
            coins += clickPower;
            updateUI();
            saveGame();
        }, 1000);
    }
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
        passiveIncome // добавлено
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

// Обернуть основные функции для автосохранения
catImg.addEventListener('click', autoSaveWrap(function(e) {
    let reward = clickPower;
    if (boosterActive) reward *= 2;
    coins += reward;
    updateUI();
    gainXP(xpPerClick);
    catImg.classList.add('clicked');
    setTimeout(() => catImg.classList.remove('clicked'), 200);

    // Всплывающая монетка
    const coin = document.createElement('div');
    coin.textContent = boosterActive ? `+${reward}` : '+1';
    coin.className = 'coin-float';
    coin.style.left = (e.offsetX || 50) + 'px';
    coin.style.top = (e.offsetY || 50) + 'px';
    document.getElementById('cat-area').appendChild(coin);
    setTimeout(() => coin.remove(), 700);

    state.totalClicks++;
    checkAchievements(state);
}));

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
    if (autoclick) return showNotification('Уже куплено!');
    if (coins < 50) return showNotification('Недостаточно монет!');
    coins -= 50;
    autoclick = true;
    updateUI();
    showNotification('Автокликер активирован!');
    if (!window._autoclickerStarted) {
        window._autoclickerStarted = true;
        setInterval(() => {
            coins += clickPower;
            updateUI();
            saveGame();
        }, 1000);
    }
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
    if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
        localStorage.removeItem('catclickerSave');
        localStorage.removeItem('catclickerLastBonus');
        location.reload();
    }
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