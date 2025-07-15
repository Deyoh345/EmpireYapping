const fs = require('node:fs');
const path = require('node:path');

const playersFilePath = path.join(__dirname, '..', 'data', 'players.json');
let players = {}; // Cache untuk menyimpan data pemain di memori

// Muat data pemain dari file ke cache saat bot pertama kali dijalankan
function loadPlayers() {
    try {
        if (fs.existsSync(playersFilePath)) {
            const data = fs.readFileSync(playersFilePath, 'utf8');
            // Pastikan file tidak kosong sebelum parsing
            players = JSON.parse(data || '{}');
        } else {
            // Jika file tidak ada, buat file baru dengan objek kosong
            fs.writeFileSync(playersFilePath, JSON.stringify({}));
        }
    } catch (error) {
        console.error('Gagal memuat data pemain:', error);
        players = {}; // Fallback ke objek kosong jika ada error
    }
}

// Simpan data pemain dari cache ke file
function savePlayers() {
    try {
        fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2));
    } catch (error) {
        console.error('Gagal menyimpan data pemain:', error);
    }
}

// Fungsi utama untuk mendapatkan data pemain.
// Jika pemain belum ada, buat data default untuk mereka.
function getPlayer(userId) {
    if (!players[userId]) {
        // Struktur data default untuk pemain baru
        players[userId] = {
            username: '', // Akan diisi saat registrasi
            rank: 'Plebeian',
            class: 'Plebeian',
            level: 1,
            xp: 0,
            strength: 5,
            intelligence: 5,
            health: 100,
            maxHealth: 100,
            mp: 50,
            maxMp: 50,
            denarii: 10,
            lastTrain: 0,
            lastExplored: 0,
            lastMeditated: 0,
            inventory: {},
        };
    }

    const player = players[userId];

    // Normalisasi: Memastikan pemain lama memiliki semua properti yang diperlukan.
    // Ini akan mencegah error jika properti baru ditambahkan di masa depan.
    player.username = player.username || '';
    player.rank = player.rank || 'Plebeian';
    player.class = player.class || 'Plebeian';
    player.level = player.level || 1;
    player.xp = typeof player.xp === 'number' ? player.xp : 0;
    player.strength = player.strength || 5;
    player.intelligence = player.intelligence || 5;
    player.maxHealth = player.maxHealth || 100;
    player.health = typeof player.health === 'number' ? player.health : player.maxHealth;
    player.mp = typeof player.mp === 'number' ? player.mp : 0;
    player.maxMp = player.maxMp || (player.class === 'Magus' ? 50 : 0);
    player.denarii = typeof player.denarii === 'number' ? player.denarii : 10;
    player.inventory = player.inventory || {}; // Perbaikan utama untuk error yang dilaporkan

    return player;
}

// Inisialisasi: muat data saat bot mulai dan atur penyimpanan otomatis
loadPlayers();
setInterval(savePlayers, 300000); // Simpan setiap 5 menit

module.exports = { getPlayer, savePlayers, players };