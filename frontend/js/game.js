// Инициализация Telegram Mini App
const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id || null;

// Игровые переменные
let player = {
    money: 1000,
    population: 10,
    happiness: 50
};
let factories = [];
let parks = [];
let houses = [];
let schools = []; // Добавьте массив для школ
let roads = [];
let houseLevels = [];
let factoryLevels = [];

// Обновление UI
function updateUI() {
    document.getElementById('money').textContent = player.money;
    document.getElementById('population').textContent = player.population;
    document.getElementById('happiness').textContent = player.happiness;
    document.getElementById('stat-buildings').textContent = houses.length + factories.length + parks.length;
}
updateUI();

// Покупка монет
document.getElementById('buy-coins').onclick = function() {
    // Здесь должен быть ваш токен платежа Telegram
    tg.openInvoice('YOUR_PAYMENT_TOKEN', (status) => {
        if (status === 'paid') {
            addCoins(1000);
        }
    });
};

function addCoins(amount) {
    player.money += amount;
    updateUI();
}

// Доход от заводов
function collectIncome() {
    let income = factories.length * 100;
    player.money += income;
    updateUI();
}
setInterval(collectIncome, 60000); // Каждую минуту

// --- Three.js сцена ---
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 10;
controls.maxDistance = 40;

let planeSize = 20; // начальный размер

// Создание плоскости (замените старый код создания plane)
let geometry = new THREE.PlaneGeometry(planeSize, planeSize);
let material = new THREE.MeshBasicMaterial({ color: 0x7ec850 });
let plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

let gridHelper = new THREE.GridHelper(planeSize, planeSize, 0x888888, 0xcccccc);
gridHelper.position.y = 0.01; // чуть выше плоскости, чтобы не мерцала
scene.add(gridHelper);

// Функция для постройки дома
function addHouse(x, z) {
    let house = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x00cc66 })
    );
    house.position.set(x, 0.5, z);
    scene.add(house);
    houses.push(house);
    houseLevels.push(1);
    player.population += 5;
    player.happiness += 2;
    player.money -= 200;
    updateUI();
    saveProgress();
    animateBuilding(house);
}

// Улучшение дома
function upgradeHouse(index) {
    if (player.money >= 150) {
        houseLevels[index]++;
        player.population += 3;
        player.money -= 150;
        houses[index].scale.y += 0.3;
        updateUI();
        showNotification('Дом улучшен!');
        saveProgress();
    } else {
        showNotification('Недостаточно денег для улучшения!');
    }
}

// Функция для постройки завода
function addFactory(x, z) {
    let box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2), // 2×2 квадрата
        new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    box.position.set(x, 1, z);
    scene.add(box);
    factories.push(box);
    factoryLevels.push(1);
    player.money -= 500;
    updateUI();
    saveProgress();
    animateBuilding(box);
}

function addPark(x, z) {
    let park = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.2, 16), // радиус 1, чтобы занять 2×2
        new THREE.MeshLambertMaterial({ color: 0x4caf50 })
    );
    park.position.set(x, 0.1, z);
    scene.add(park);
    parks.push(park);
    player.happiness += 10;
    player.money -= 300;
    updateUI();
    saveProgress();
    animateBuilding(park);
}

function addSchool(x, z) {
    let school = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xffeb3b })
    );
    school.position.set(x, 0.5, z);
    scene.add(school);
    schools.push(school); // Добавляем школу в массив
    player.population += 10;
    player.happiness += 5;
    player.money -= 700;
    updateUI();
    saveProgress();
    showNotification('Школа построена!');
    animateBuilding(school);
}

function addHospital(x, z) {
    let hospital = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xe57373 })
    );
    hospital.position.set(x, 0.5, z);
    scene.add(hospital);
    player.happiness += 15;
    player.money -= 900;
    updateUI();
    saveProgress();
    showNotification('Больница построена!');
    animateBuilding(hospital);
}

function addRoad(x, z) {
    let road = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    road.position.set(x, 0.05, z);
    scene.add(road);
    roads.push(road);
    player.money -= 50;
    updateUI();
    saveProgress();
    showNotification('Дорога построена!');
    animateBuilding(road);
}

// Уведомления
function showNotification(text) {
    const notif = document.getElementById('notification');
    notif.textContent = text;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
}

// Обработчики кнопок
document.getElementById('build-house').onclick = function () {
    selectedBuilding = 'house';
    showNotification('Кликните по карте, чтобы построить дом');
};
document.getElementById('build-factory').onclick = function () {
    selectedBuilding = 'factory';
    showNotification('Кликните по карте, чтобы построить завод');
};
document.getElementById('build-park').onclick = function () {
    selectedBuilding = 'park';
    showNotification('Кликните по карте, чтобы построить парк');
};
document.getElementById('build-school').onclick = function () {
    selectedBuilding = 'school';
    showNotification('Кликните по карте, чтобы построить школу');
};
document.getElementById('build-hospital').onclick = function () {
    selectedBuilding = 'hospital';
    showNotification('Кликните по карте, чтобы построить больницу');
};
document.getElementById('build-road').onclick = function () {
    selectedBuilding = 'road';
    showNotification('Кликните по карте, чтобы построить дорогу');
};

camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Сохранение и загрузка прогресса
function saveProgress() {
    fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, player })
    });
}

function loadProgress() {
    fetch(`/api/load/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (data.player) {
                player = data.player;
                updateUI();
            }
        });
}

// Ежедневный бонус
function giveDailyBonus() {
    player.money += 500;
    showNotification('Ежедневный бонус: +500 монет!');
    updateUI();
}
giveDailyBonus();

// Обслуживание зданий
function payMaintenance() {
    let cost = houses.length * 10 + factories.length * 30 + parks.length * 15;
    player.money -= cost;
    if (player.money < 0) player.money = 0;
    updateUI();
    showNotification(`Обслуживание зданий: -${cost} монет`);
}
setInterval(payMaintenance, 120000);

// Случайное событие (пожар)
function randomEvent() {
    if (Math.random() < 0.2 && houses.length > 0) {
        let burned = houses.pop();
        scene.remove(burned);
        player.population -= 5;
        showNotification('Пожар! Один дом сгорел!');
        updateUI();
        saveProgress();
    }
}
setInterval(randomEvent, 180000);

// Квесты
let quests = [
    { text: 'Постройте 3 дома', check: () => houses.length >= 3, reward: 300, done: false },
    { text: 'Постройте 2 завода', check: () => factories.length >= 2, reward: 500, done: false },
    { text: 'Постройте 2 парка', check: () => parks.length >= 2, reward: 400, done: false },
    { text: 'Постройте школу', check: () => schools.length >= 1, reward: 700, done: false }
];

function renderQuests() {
    const questPanel = document.getElementById('quests');
    if (!questPanel) return;
    questPanel.innerHTML = '<b>Задания:</b><br>' + quests.map(q =>
        q.done ? `<span style="color:gray;text-decoration:line-through">${q.text}</span>` : q.text
    ).join('<br>');
}
setInterval(renderQuests, 1000);

function checkQuests() {
    quests.forEach(q => {
        if (!q.done && q.check()) {
            player.money += q.reward;
            q.done = true;
            showNotification(`Задание выполнено! +${q.reward} монет`);
            updateUI();
        }
    });
}
setInterval(checkQuests, 5000);

// Анимация появления зданий
function animateBuilding(building) {
    building.scale.set(1, 0.1, 1);
    let grow = () => {
        if (building.scale.y < 1) {
            building.scale.y += 0.1;
            requestAnimationFrame(grow);
        } else {
            building.scale.y = 1;
        }
    };
    grow();
}

// Позитивные события
function randomPositiveEvent() {
    if (Math.random() < 0.1) {
        player.money += 200;
        showNotification('Праздник в городе! +200 монет');
        updateUI();
        saveProgress();
    }
}
setInterval(randomPositiveEvent, 120000); // Каждые 2 минуты

let selectedBuilding = null;

renderer.domElement.addEventListener('pointerdown', function(event) {
    if (!selectedBuilding) return;

    // Получаем координаты мыши
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Луч для определения точки пересечения с плоскостью
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        let point = intersects[0].point;
        // Привязка к сетке с шагом 1 (можно изменить шаг)
        const gridSize = 1;
        if (selectedBuilding === 'factory' || selectedBuilding === 'park') {
            point.x = Math.round(point.x / 2) * 2;
            point.z = Math.round(point.z / 2) * 2;
        } else {
            point.x = Math.floor(point.x) + 0.5;
            point.z = Math.floor(point.z) + 0.5;
        }
        // Проверяем деньги и строим выбранное здание
        if (selectedBuilding === 'house' && player.money >= 200) {
            if (isAreaFree(point.x, point.z, 1)) {
                addHouse(point.x, point.z);
                showNotification('Дом построен!');
            } else {
                showNotification('Место занято! Выберите другое');
            }
        } else if (selectedBuilding === 'factory' && player.money >= 500) {
            if (isAreaFree(point.x, point.z, 2)) {
                addFactory(point.x, point.z);
                showNotification('Завод построен!');
            } else {
                showNotification('Место занято! Выберите другое');
            }
        } else if (selectedBuilding === 'park' && player.money >= 300) {
            if (isAreaFree(point.x, point.z, 2)) {
                addPark(point.x, point.z);
                showNotification('Парк построен!');
            } else {
                showNotification('Место занято! Выберите другое');
            }
        } else if (selectedBuilding === 'school' && player.money >= 700) {
            if (isPlaceFree(point.x, point.z)) {
                addSchool(point.x, point.z);
            } else {
                showNotification('Место занято! Выберите другое');
            }
        } else if (selectedBuilding === 'hospital' && player.money >= 900) {
            if (isPlaceFree(point.x, point.z)) {
                addHospital(point.x, point.z);
            } else {
                showNotification('Место занято! Выберите другое');
            }
        } else if (selectedBuilding === 'road' && player.money >= 50) {
            addRoad(point.x, point.z);
        } else {
            showNotification('Недостаточно денег!');
        }
        selectedBuilding = null;
    }
});

renderer.domElement.addEventListener('dblclick', function(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    // Проверяем все здания
    let allBuildings = [...houses, ...factories, ...parks];
    const intersects = raycaster.intersectObjects(allBuildings);
    if (intersects.length > 0) {
        showNotification('Это здание: ' + (houses.includes(intersects[0].object) ? 'Дом' : factories.includes(intersects[0].object) ? 'Завод' : 'Парк'));
    }
});

function isPlaceFree(x, z, minDist = 1.5) {
    // Проверяем все здания
    for (let h of houses) if (h.position.distanceTo(new THREE.Vector3(x, h.position.y, z)) < minDist) return false;
    for (let f of factories) if (f.position.distanceTo(new THREE.Vector3(x, f.position.y, z)) < minDist) return false;
    for (let p of parks) if (p.position.distanceTo(new THREE.Vector3(x, p.position.y, z)) < minDist) return false;
    // Можно добавить школы и больницы аналогично
    return true;
}

// Проверяет, свободна ли область size×size с центром в (x, z)
function isAreaFree(x, z, size = 1, minDist = 1.5) {
    for (let dx = -0.5 * (size - 1); dx <= 0.5 * (size - 1); dx++) {
        for (let dz = -0.5 * (size - 1); dz <= 0.5 * (size - 1); dz++) {
            let px = x + dx;
            let pz = z + dz;
            if (!isPlaceFree(px, pz, minDist)) return false;
        }
    }
    return true;
}

// Улучшение завода
function upgradeFactory(index) {
    if (player.money >= 300) {
        factoryLevels[index]++;
        player.money -= 300;
        factories[index].scale.y += 0.5;
        updateUI();
        showNotification('Завод улучшен!');
        saveProgress();
    } else {
        showNotification('Недостаточно денег для улучшения!');
    }
}

// Функция расширения плоскости
function expandPlane() {
    if (player.money >= 1000) {
        player.money -= 1000;
        planeSize += 10;
        scene.remove(plane);
        geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);
        updateUI();
        showNotification('Территория расширена!');
    } else {
        showNotification('Недостаточно денег для расширения!');
    }
}

// Обработчик кнопки
document.getElementById('expand-plane').onclick = expandPlane;

document.getElementById('menu-toggle').onclick = function() {
    const panel = document.getElementById('ui-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
};
// По умолчанию на мобильных скрываем меню
if (window.innerWidth < 700) {
    document.getElementById('ui-panel').style.display = 'none';
}