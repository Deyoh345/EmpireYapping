const { Events } = require('discord.js');
const { getPlayer, savePlayers } = require('../utils/playerData');

// Definisikan statistik awal untuk setiap kelas agar mudah dikelola
const classStats = {
    gladiator: { rank: 'Gladiator', class: 'Gladiator', strength: 15, intelligence: 5, maxHealth: 110, denarii: 20 },
    mercenary: { rank: 'Mercenary', class: 'Mercenary', strength: 12, intelligence: 8, maxHealth: 100, denarii: 30 },
    merchant:  { rank: 'Merchant', class: 'Merchant', strength: 6, intelligence: 12, maxHealth: 90, denarii: 150 },
    magus:     { rank: 'Magus', class: 'Magus', strength: 5, intelligence: 15, maxHealth: 90, maxMp: 80, denarii: 25 },
    assassin:  { rank: 'Assassin', class: 'Assassin', strength: 14, intelligence: 9, maxHealth: 95, denarii: 25 },
    ranger:    { rank: 'Ranger', class: 'Ranger', strength: 11, intelligence: 11, maxHealth: 100, denarii: 25 },
    paladin:   { rank: 'Paladin', class: 'Paladin', strength: 10, intelligence: 6, maxHealth: 120, denarii: 20 },
    berserker: { rank: 'Berserker', class: 'Berserker', strength: 18, intelligence: 4, maxHealth: 100, denarii: 15 },
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Terjadi error saat menjalankan perintah ini!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Terjadi error saat menjalankan perintah ini!', ephemeral: true });
                }
            }
        }
        // Handle Button Interactions
        else if (interaction.isButton()) {
            // Handle class registration buttons
            if (interaction.customId.startsWith('register-class-')) {
                const userId = interaction.user.id;
                const player = getPlayer(userId);

                if (player.username) {
                    return interaction.reply({ content: 'Anda sudah terdaftar!', ephemeral: true });
                }

                const chosenClass = interaction.customId.replace('register-class-', '');
                const stats = classStats[chosenClass];

                if (!stats) {
                    console.error(`Invalid class chosen: ${chosenClass}`);
                    return interaction.reply({ content: 'Kelas yang Anda pilih tidak valid.', ephemeral: true });
                }

                // Assign data to player
                player.username = interaction.user.username;
                player.rank = stats.rank;
                player.class = stats.class;
                player.strength = stats.strength;
                player.intelligence = stats.intelligence;
                player.maxHealth = stats.maxHealth;
                player.health = stats.maxHealth; // Full health on start
                player.denarii = stats.denarii;
                if (stats.maxMp) {
                    player.maxMp = stats.maxMp;
                    player.mp = stats.maxMp; // Full MP on start
                }

                savePlayers();

                await interaction.update({
                    content: `Selamat, **${interaction.user.username}**! Anda telah terdaftar sebagai **${stats.class}**. Takdir Anda dimulai sekarang! Gunakan \`/profile\` untuk melihat status Anda.`,
                    components: [], // Hapus tombol
                    files: [] // Hapus gambar
                });
            }
            // Tombol lain bisa ditangani di sini jika perlu
        }
    },
};