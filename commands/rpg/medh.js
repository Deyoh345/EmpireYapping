const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getPlayer, savePlayers } = require('../../utils/playerData');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

/**
 * Membuat gambar hasil meditasi yang menunjukkan proses penyembuhan.
 */
async function createHealImage(player, healthBefore, amountHealed, denariiCost) {
    const canvasWidth = 800;
    const canvasHeight = 300;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Latar belakang
    try {
        const bgPath = path.join(__dirname, '..', '..', 'assets', 'backgrounds', 'meditation_background.png');
        if (fs.existsSync(bgPath)) {
            const background = await loadImage(bgPath);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a3f2b'; // Warna hijau gelap jika gambar tidak ada
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } catch (e) {
        console.error('Gagal memuat gambar latar belakang meditasi:', e);
        ctx.fillStyle = '#2a3f2b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Lapisan semi-transparan untuk keterbacaan teks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Judul
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#aaffaa'; // Hijau terang
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 7;
    ctx.fillText('Meditasi Selesai', canvas.width / 2, 60);

    // Info Penyembuhan
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#55ff55'; // Hijau cerah untuk heal
    ctx.fillText(`+${amountHealed} HP`, canvas.width / 2, 110);

    ctx.fillStyle = '#ffdd55'; // Emas untuk biaya
    ctx.fillText(`-${denariiCost} Denarii`, canvas.width / 2, 150);
    ctx.shadowBlur = 0;

    // Bar HP
    const barWidth = 600;
    const barHeight = 40;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = 200;

    // Latar belakang bar
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    // Bagian HP sebelum heal (untuk efek visual)
    const healthBeforeWidth = (healthBefore / player.maxHealth) * barWidth;
    ctx.fillStyle = '#c0392b'; // Merah
    ctx.beginPath();
    ctx.roundRect(barX, barY, healthBeforeWidth, barHeight, 15);
    ctx.fill();

    // Bagian HP setelah heal (menimpa bagian sebelumnya)
    const healthAfterWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = '#2ecc71'; // Hijau
    ctx.beginPath();
    ctx.roundRect(barX, barY, healthAfterWidth, barHeight, 15);
    ctx.fill();

    // Teks HP di atas bar
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`${player.health} / ${player.maxHealth}`, canvas.width / 2, barY + 28);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('medh')
        .setDescription('Meditasi untuk memulihkan HP dengan biaya Denarii.'),
    async execute(interaction) {
        const player = getPlayer(interaction.user.id);

        if (!player.username) {
            return interaction.reply({ content: 'Anda harus mendaftar terlebih dahulu! Gunakan `/register`.', ephemeral: true });
        }
        if (player.health >= player.maxHealth) {
            return interaction.reply({ content: 'HP Anda sudah penuh, tidak perlu meditasi.', ephemeral: true });
        }

        await interaction.deferReply();

        const healthBefore = player.health;

        // Menghasilkan jumlah heal acak antara 25 dan 30
        const potentialHeal = Math.floor(Math.random() * 6) + 25;
        // Menghitung berapa banyak heal yang sebenarnya dibutuhkan agar tidak melebihi HP maks
        const neededHeal = player.maxHealth - healthBefore;
        // Jumlah heal akhir adalah nilai terkecil antara heal acak dan heal yang dibutuhkan
        const amountHealed = Math.min(potentialHeal, neededHeal);

        const denariiCost = Math.max(5, Math.ceil(amountHealed / 2)); // Biaya 1 Denarii per 2 HP, min 5

        if (player.denarii < denariiCost) {
            return interaction.editReply(`Anda tidak punya cukup Denarii. Anda butuh ${denariiCost} Denarii untuk meditasi.`);
        }

        player.health += amountHealed;
        player.denarii -= denariiCost;
        savePlayers();

        const imageBuffer = await createHealImage(player, healthBefore, amountHealed, denariiCost);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'meditation-heal.png' });

        await interaction.editReply({ files: [attachment] });
    },
};