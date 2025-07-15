const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');
const { getPlayer, savePlayers } = require('../../utils/playerData');

// Muat data monster
const monstersFilePath = path.join(__dirname, '..', '..', 'data', 'monsters.json');
const itemsFilePath = path.join(__dirname, '..', '..', 'data', 'items.json');
const monsters = JSON.parse(fs.readFileSync(monstersFilePath, 'utf8'));
const itemDb = JSON.parse(fs.readFileSync(itemsFilePath, 'utf8'));

function getXpForNextLevel(level) {
    return 50 * level * level;
}

/**
 * Menggambar teks yang bisa pindah baris jika melebihi batas lebar.
 * Fungsi ini juga menghormati karakter newline (\n) yang sudah ada.
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const paragraphs = text.split('\n');
    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let line = '';
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line, x, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Jelajahi area sekitar untuk bertarung dengan monster dan mendapatkan hadiah!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = getPlayer(userId);

        if (!player.username) {
            return interaction.reply({ content: 'Anda harus mendaftar terlebih dahulu! Gunakan `/register`.', ephemeral: true });
        }

        const now = Date.now();
        const cooldown = 20 * 1000; // 60 detik cooldown

        if (now - player.lastExplored < cooldown) {
            const timeLeft = ((cooldown - (now - player.lastExplored)) / 1000).toFixed(1);
            return interaction.reply({ content: `Anda masih lelah. Coba lagi dalam ${timeLeft} detik.`, ephemeral: true });
        }

        player.lastExplored = now;
        await interaction.deferReply();

        // Pilih monster acak dari daftar "Normal"
        if (!monsters || monsters.length === 0) {
            return interaction.editReply('Tidak ada monster biasa untuk dilawan saat ini.');
        }
        // Pilih monster acak dari array monster
        const monster = { ...monsters[Math.floor(Math.random() * monsters.length)] };

        let playerHealth = player.health;
        let monsterHealth = monster.health;
        let battleLog = `🌲 Bertemu **${monster.name}**!\n\n`;

        // Pertarungan
        while (playerHealth > 0 && monsterHealth > 0) {
            // Giliran pemain
            let playerDamage;
            let playerAttackType = '';
            if (player.class === 'God') {
                playerDamage = 999999;
                playerAttackType = ' (Divine)';
            } else if (player.class === 'Magus') {
                // Serangan Magus menggunakan Intelligence
                playerDamage = Math.max(1, player.intelligence + Math.floor(Math.random() * 5) - 2);
                playerAttackType = ' (Sihir)';
            } else {
                playerDamage = Math.max(1, player.strength + Math.floor(Math.random() * 5) - 2); // Min 1 damage
            }
            monsterHealth -= playerDamage;
            battleLog += `⚔️ Anda -> ${monster.name} **(-${playerDamage} HP)**${playerAttackType}\n`;
            if (monsterHealth <= 0) break;

            // Giliran monster
            let monsterDamage;
            let attackType = '';
            // 40% chance to use magic if available
            if (monster.magic && Math.random() < 0.4) {
                monsterDamage = Math.max(1, monster.magic + Math.floor(Math.random() * 4) - 2); // Magic damage variation
                attackType = ' (Sihir)';
            } else {
                monsterDamage = Math.max(1, monster.damage + Math.floor(Math.random() * 3) - 1); // Min 1 damage
            }
            playerHealth -= monsterDamage;
            battleLog += `🩸 ${monster.name} -> Anda **(-${monsterDamage} HP)**${attackType}\n`;
        }

        // Hasil pertarungan
        if (playerHealth <= 0) {
            player.health = 1; // Kembali dengan 1 HP
            battleLog += `\n☠️ Kalah. Anda kembali dengan 1 HP.`;
        } else {
            player.health = playerHealth;
            const xpGain = monster.xp;
            const denariiGain = monster.denarii;
            player.xp += xpGain;
            player.denarii += denariiGain;

            battleLog += `\n🏆 Menang! +${xpGain} XP & +${denariiGain} Denarii.\n`;

            // Handle item drops
            if (monster.drops && monster.drops.length > 0) {
                // Defensive check to ensure player.inventory exists.
                // This prevents crashes if a player's data was created before the inventory system.
                if (!player.inventory) {
                    player.inventory = {};
                }
                for (const drop of monster.drops) {
                    if (Math.random() < drop.chance) {
                        const itemData = itemDb.find(item => item.id === drop.id);
                        if (itemData) {
                            if (player.inventory[drop.id]) {
                                player.inventory[drop.id].quantity += 1;
                            } else {
                                player.inventory[drop.id] = { ...itemData, quantity: 1 };
                            }
                            battleLog += `\n🎁 **${monster.name}** menjatuhkan **${itemData.name}**!`;
                        }
                    }
                }
            }


            // Cek level up
            let xpForNext = getXpForNextLevel(player.level);
            while (player.xp >= xpForNext) {
                player.level++;
                player.xp -= xpForNext;
                player.maxHealth += 10;
                player.health = player.maxHealth; // Pulihkan HP penuh saat naik level
                player.strength += 2;
                player.intelligence += 1;
                battleLog += `\n🎉 **LEVEL UP!** Mencapai Lv. ${player.level}.\nHP pulih & stat meningkat!`;
                xpForNext = getXpForNextLevel(player.level);
            }
        }
        
        savePlayers(); // Simpan perubahan data pemain

        // Membuat gambar hasil pertarungan
        const canvas = createCanvas(700, 500);
        const ctx = canvas.getContext('2d');

        // Latar belakang
        try {
            const bgPath = path.join(__dirname, '..', '..', 'assets', 'backgrounds', 'explore_background.png');
            if (fs.existsSync(bgPath)) {
                const background = await loadImage(bgPath);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback ke warna solid jika gambar tidak ditemukan
                ctx.fillStyle = '#2C2F33';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                console.warn(`File latar belakang tidak ditemukan di: ${bgPath}`);
            }
        } catch (e) {
            console.error('Gagal memuat gambar latar belakang:', e);
            ctx.fillStyle = '#2C2F33';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Gambar monster
        try {
            const imagePath = path.join(__dirname, '..', '..', 'assets', 'monsters', monster.image);
            if (fs.existsSync(imagePath)) {
                const monsterImage = await loadImage(imagePath);
                const monsterSize = 200;
                const monsterX = 50;
                const monsterY = 50;

                ctx.save();
                ctx.beginPath();
                // Membuat path lingkaran
                ctx.arc(monsterX + monsterSize / 2, monsterY + monsterSize / 2, monsterSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                
                // Menambahkan bingkai putih di sekitar lingkaran
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 6;
                ctx.stroke();
                
                // Mengatur area gambar menjadi lingkaran
                ctx.clip();
                ctx.drawImage(monsterImage, monsterX, monsterY, monsterSize, monsterSize);
                ctx.restore();
            }
        } catch (e) { console.error(`Gagal memuat gambar: ${monster.image}`, e); }

        // Info Monster & Battle Log
        // Latar semi-transparan untuk keterbacaan
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(290, 40, 380, 350, 15);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(monster.name, 290 + 15, 75); // Beri sedikit padding
        ctx.font = '16px sans-serif';
        drawWrappedText(ctx, battleLog, 290 + 15, 110, 350, 22);

        // Status Pemain
        const playerStatus = `Status Anda: Level ${player.level} | HP: ${player.health}/${player.maxHealth} | XP: ${player.xp}/${getXpForNextLevel(player.level)} | Denarii: ${player.denarii}`;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(playerStatus, canvas.width / 2, canvas.height - 35);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'explore-result.png' });
        await interaction.editReply({ files: [attachment] });
    },
};