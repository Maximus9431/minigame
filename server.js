const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const basicAuth = require('express-basic-auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const ADMIN_PASSWORD = '123456'; // Задай свой пароль

let onlineUsers = {};
let leaderboard = []; // [{name, score}]

// Basic auth для /admin
app.use('/admin', basicAuth({
    users: { 'admin': ADMIN_PASSWORD },
    challenge: true,
    realm: 'Admin Area'
}));

// Отдаём клиентские файлы (предполагается, что index.html и всё остальное лежит в public)
app.use(express.static('public'));

// Админ-панель
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

// API для топа
app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard.slice(0, 50));
});

// WebSocket для онлайна
io.on('connection', (socket) => {
    let username = null;

    socket.on('login', (data) => {
        username = data.name;
        onlineUsers[socket.id] = username;
        io.emit('online', Object.values(onlineUsers).length);
    });

    socket.on('score', (data) => {
        let found = leaderboard.find(u => u.name === data.name);
        if (found) {
            if (data.score > found.score) found.score = data.score;
        } else {
            leaderboard.push({ name: data.name, score: data.score });
        }
        leaderboard.sort((a, b) => b.score - a.score);
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('online', Object.values(onlineUsers).length);
    });
});

server.listen(3000, () => {
    console.log('Server started on http://127.0.0.1:5500/');
});