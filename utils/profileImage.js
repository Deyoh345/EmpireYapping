const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('node:path');

// (Opsional) Daftarkan font kustom untuk tampilan yang lebih baik
// Anda bisa mengunduh font bertema Romawi (misal: "Cinzel") dari Google Fonts
// dan letakkan di folder, misalnya `assets/fonts/Cinzel-Regular.ttf`
// registerFont(path.resolve(__dirname, '..', 'assets', 'fonts', 'Cinzel-Regular.ttf'), { family: 'RomanFont' });

function getXpForNextLevel(level) {
    return 50 * level * level;
}

/**
 * Membuat gambar kartu profil untuk pemain.
 * @param {import('discord.js').User} user Objek user Discord.
 * @param {object} playerData Data pemain dari players.json.
 * @returns {Promise<Buffer>} Buffer gambar PNG.
 */
async function createProfileImage(user, playerData) {
    const canvasWidth = 800;
    const canvasHeight = 300;

    // Gunakan 'RomanFont' jika Anda mendaftarkannya, jika tidak gunakan 'sans-serif'
    const mainFont = 'sans-serif';

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 1. Latar Belakang Gradient Emas ke Putih
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#FFD700'); // Warna Emas
    gradient.addColorStop(1, '#F5F5F5'); // Warna Putih Gading
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Gambar Avatar Pengguna (dibuat bulat)
    const avatarSize = 150;
    const avatarX = 50;
    const avatarY = (canvasHeight - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // 3. Tulis Teks Informasi
    const textX = avatarX + avatarSize + 40;
    ctx.fillStyle = '#333333'; // Warna teks abu-abu gelap agar mudah dibaca

    // Nama Pengguna
    ctx.font = `bold 40px ${mainFont}`;
    ctx.fillText(playerData.username, textX, 70, 500); // Batasi lebar teks

    // Pangkat & Level
    ctx.font = `28px ${mainFont}`;
    ctx.fillText(`Pangkat: ${playerData.rank}`, textX, 115);
    ctx.fillText(`Level: ${playerData.level}`, textX + 300, 115);

    // Cek apakah pemain adalah kelas God
    const isGod = playerData.class === 'God';

    // Statistik
    ctx.font = `24px ${mainFont}`;
    if (playerData.class === 'Magus') {
        // Layout khusus untuk Magus
        ctx.fillText(`❤️ HP: ${isGod ? '∞ / ∞' : `${playerData.health} / ${playerData.maxHealth}`}`, textX, 170);
        ctx.fillText(`🔮 MP: ${isGod ? '∞' : `${playerData.mp} / ${playerData.maxMp}`}`, textX + 250, 170);
        ctx.fillText(`🧠 Intelijen: ${isGod ? '∞' : playerData.intelligence}`, textX, 215);
        ctx.fillText(`💰 Denarii: ${isGod ? '∞' : playerData.denarii}`, textX + 250, 215);
    } else {
        // Layout standar untuk kelas lain
        ctx.fillText(`❤️ HP: ${isGod ? '∞ / ∞' : `${playerData.health} / ${playerData.maxHealth}`}`, textX, 170);
        ctx.fillText(`💪 Kekuatan: ${isGod ? '∞' : playerData.strength}`, textX, 200);
        ctx.fillText(`💰 Denarii: ${isGod ? '∞' : playerData.denarii}`, textX, 230);
    }

    // 4. Gambar Bar XP
    const xpBarWidth = 450;
    const xpBarHeight = 30;
    const xpBarX = textX;
    const xpBarY = canvasHeight - 45;
    
    let xpNeeded, xpProgress, xpText;
    if (isGod) {
        xpNeeded = 1; // Hanya untuk menghindari pembagian dengan nol
        xpProgress = xpBarWidth; // Bar penuh
        xpText = 'MAX LEVEL';
    } else {
        xpNeeded = getXpForNextLevel(playerData.level);
        xpProgress = (playerData.xp / xpNeeded) * xpBarWidth;
        xpText = `${playerData.xp} / ${xpNeeded} XP`;
    }

    // Latar bar XP
    ctx.fillStyle = '#555555';
    ctx.fillRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);

    // Progres bar XP
    ctx.fillStyle = '#2a9fd6'; // Biru cerah
    ctx.fillRect(xpBarX, xpBarY, xpProgress > xpBarWidth ? xpBarWidth : xpProgress, xpBarHeight);

    // Teks XP di atas bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `18px ${mainFont}`;
    const textWidth = ctx.measureText(xpText).width;
    ctx.fillText(xpText, xpBarX + (xpBarWidth - textWidth) / 2, xpBarY + 21);

    return canvas.toBuffer('image/png');
}

module.exports = { createProfileImage };