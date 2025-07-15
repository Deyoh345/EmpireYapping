const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, savePlayers } = require('../../utils/playerData');
const COOLDOWN_SECONDS = 60 * 5; // 5 menit

function getXpForNextLevel(level) {
    return 50 * level * level;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('train')
        .setDescription('Berlatih untuk meningkatkan statistik utamamu.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const playerData = getPlayer(userId);

        // Cek apakah pemain sudah terdaftar
        if (!playerData.username) {
            return interaction.reply({ content: 'Anda harus mendaftar terlebih dahulu! Gunakan /register.', ephemeral: true });
        }

        const now = Math.floor(Date.now() / 1000);
        const lastTrain = playerData.lastTrain || 0;
        const timeRemaining = (lastTrain + COOLDOWN_SECONDS) - now;

        if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            return interaction.reply({
                content: `Anda masih lelah. Anda bisa berlatih lagi dalam ${minutes} menit ${seconds} detik.`,
                ephemeral: true
            });
        }

        // Latihan berhasil
        const xpGain = Math.floor(Math.random() * 10) + 5; // Dapat 5-15 XP
        playerData.xp += xpGain;
        playerData.lastTrain = now;

        let statGainMessage;
        if (playerData.class === 'Magus') {
            const intGain = Math.floor(Math.random() * 3) + 1; // Dapat 1-3 intelijen
            // Inisialisasi intelijen jika belum ada, untuk keamanan
            playerData.intelligence = (playerData.intelligence || 0) + intGain;
            statGainMessage = `Anda bermeditasi dan mendapatkan **${intGain} intelijen** dan **${xpGain} XP**! Intelijen Anda sekarang adalah **${playerData.intelligence}**.`;
        } else {
            const strengthGain = Math.floor(Math.random() * 3) + 1; // Dapat 1-3 kekuatan
            playerData.strength += strengthGain;
            statGainMessage = `Anda berlatih dengan giat dan mendapatkan **${strengthGain} kekuatan** dan **${xpGain} XP**! Kekuatan Anda sekarang adalah **${playerData.strength}**.`;
        }

        // Tambahkan logika level-up agar konsisten dengan /explore
        let levelUpMessage = '';
        let xpForNext = getXpForNextLevel(playerData.level);
        while (playerData.xp >= xpForNext) {
            playerData.level++;
            playerData.xp -= xpForNext;
            playerData.maxHealth += 10;
            playerData.health = playerData.maxHealth; // Pulihkan HP penuh saat naik level
            playerData.strength += 2;
            playerData.intelligence += 1;
            levelUpMessage += `\n\n🎉 **LEVEL UP!** Anda sekarang Level **${playerData.level}**!\nHP Maksimal: ${playerData.maxHealth}, Kekuatan: ${playerData.strength}. HP Anda telah pulih sepenuhnya!`;
            xpForNext = getXpForNextLevel(playerData.level);
        }

        savePlayers();

        await interaction.reply(statGainMessage + levelUpMessage);
    },
};