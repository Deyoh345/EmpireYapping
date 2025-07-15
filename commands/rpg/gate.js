const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayer, savePlayers } = require('../../utils/playerData');
const { getGate, addParticipant } = require('../../utils/gateManager');

function getXpForNextLevel(level) {
    return 50 * level * level;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gate')
        .setDescription('Masuki gerbang dimensi yang sedang terbuka untuk melawan bos.'),
    async execute(interaction) {
        const gate = getGate();
        const userId = interaction.user.id;

        // 1. Cek Kondisi
        if (!gate) {
            return interaction.reply({ content: 'Saat ini tidak ada gerbang yang terbuka.', ephemeral: true });
        }

        let player = getPlayer(userId);
        if (!player.username) {
            return interaction.reply({ content: 'Anda harus mendaftar terlebih dahulu! Gunakan `/register`.', ephemeral: true });
        }

        if (gate.participants.includes(userId)) {
            return interaction.reply({ content: 'Anda sudah berada di dalam pertempuran di gerbang ini!', ephemeral: true });
        }

        addParticipant(userId);

        await interaction.reply({ content: `Anda dengan berani melangkah masuk ke dalam Gerbang Peringkat **${gate.rank}**...`, ephemeral: true });

        // 2. Setup Pertarungan
        let boss = { ...gate.boss }; // Salinan data boss untuk pertarungan ini
        player.health = player.maxHealth; // Pulihkan HP saat masuk gate
        if (player.class === 'Magus') player.mp = player.maxMp; // Pulihkan MP

        const createBattleEmbed = (message) => {
            const isGod = player.class === 'God';
            const playerHealthBar = isGod
                ? '❤️'.repeat(10)
                : '❤️'.repeat(Math.ceil(player.health / player.maxHealth * 10)) + '🖤'.repeat(Math.max(0, 10 - Math.ceil(player.health / player.maxHealth * 10)));

            const bossHealthBar = '<:1000589786:1393770362507886592>'.repeat(Math.ceil(boss.health / gate.boss.health * 10)) + '<:1000589772:1393770414043562068>'.repeat(Math.max(0, 10 - Math.ceil(boss.health / gate.boss.health * 10)));

            const playerHPText = isGod ? '∞ / ∞' : `${Math.round(player.health)} / ${player.maxHealth}`;

            return new EmbedBuilder()
                .setColor('#c0392b')
                .setTitle(`Pertarungan: ${boss.name} (Rank ${gate.rank})`)
                .addFields(
                    { name: `${player.username}`, value: `HP: ${playerHPText}\n${playerHealthBar}`, inline: true },
                    { name: `${boss.name}`, value: `HP: ${Math.round(boss.health)} / ${gate.boss.health}\n${bossHealthBar}`, inline: true },
                    { name: 'Log Pertarungan', value: message, inline: false }
                );
        };

        const battleButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('gate-attack').setLabel('Serang Fisik').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                new ButtonBuilder().setCustomId('gate-magic').setLabel('Serang Sihir').setStyle(ButtonStyle.Primary).setEmoji('✨').setDisabled(player.class !== 'Magus'),
                new ButtonBuilder().setCustomId('gate-flee').setLabel('Kabur').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );

        const battleMessage = await interaction.channel.send({
            content: `${interaction.user}, Anda dihadapkan oleh **${boss.name}**!`,
            embeds: [createBattleEmbed('Pertarungan dimulai!')],
            components: [battleButtons]
        });

        const collector = battleMessage.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 5 * 60 * 1000 // 5 menit timeout
        });

        collector.on('collect', async i => {
            await i.deferUpdate();
            let turnMessage = '';

            // Aksi Pemain
            if (i.customId === 'gate-attack') {
                const damage = player.class === 'God' ? 999999 : player.strength + Math.floor(Math.random() * 5);
                boss.health -= damage;
                turnMessage = `Anda menyerang **${boss.name}** dan memberikan **${damage}** kerusakan!`;
            } else if (i.customId === 'gate-magic') {
                if (player.mp >= 10 || player.class === 'God') {
                    const damage = player.class === 'God' ? 999999 : player.intelligence * 2 + Math.floor(Math.random() * 10);
                    if (player.class !== 'God') {
                        player.mp -= 10;
                    }
                    boss.health -= damage;
                    turnMessage = `Anda merapal sihir ke **${boss.name}** dan memberikan **${damage}** kerusakan! (MP sisa: ${player.class === 'God' ? '∞' : player.mp})`;
                } else {
                    turnMessage = 'MP Anda tidak cukup untuk merapal sihir!';
                }
            } else if (i.customId === 'gate-flee') {
                if (Math.random() < 0.5) { collector.stop('fled'); return; }
                turnMessage = 'Anda mencoba kabur tetapi gagal!';
            }

            if (boss.health <= 0) { collector.stop('win'); return; }

            // Aksi Boss
            const bossDamage = boss.damage - Math.floor(Math.random() * (boss.damage * 0.2));
            player.health -= bossDamage;
            turnMessage += `\n**${boss.name}** menyerang Anda dan memberikan **${bossDamage}** kerusakan!`;

            if (player.health <= 0) { collector.stop('lose'); return; }

            await battleMessage.edit({ embeds: [createBattleEmbed(turnMessage)] });
        });

        collector.on('end', async (collected, reason) => {
            const finalEmbed = new EmbedBuilder();
            if (reason === 'win') {
                player.xp += gate.boss.xp;
                player.denarii += gate.boss.denarii;
                let winDescription = `Anda berhasil mengalahkan **${boss.name}**!\n\n**Hadiah:**\n+${gate.boss.xp} XP\n+${gate.boss.denarii} Denarii`;

                // Cek level up, agar konsisten dengan /explore dan /train
                let xpForNext = getXpForNextLevel(player.level);
                while (player.xp >= xpForNext && player.class !== 'God') {
                    player.level++;
                    player.xp -= xpForNext;
                    player.maxHealth += 10;
                    player.health = player.maxHealth; // Pulihkan HP penuh saat naik level
                    player.strength += 2;
                    player.intelligence += 1;
                    winDescription += `\n\n🎉 **LEVEL UP!** Anda sekarang Level **${player.level}**.\nHP pulih & stat meningkat!`;
                    xpForNext = getXpForNextLevel(player.level);
                }
                finalEmbed.setColor('#2ecc71').setTitle('Kemenangan!').setDescription(winDescription);
            } else if (reason === 'lose') {
                player.health = 1;
                player.denarii = Math.floor(player.denarii * 0.9);
                finalEmbed.setColor('#e74c3c').setTitle('Kekalahan!').setDescription(`Anda dikalahkan. Anda kehilangan kesadaran dan sebagian uang Anda.`);
            } else if (reason === 'fled') {
                finalEmbed.setColor('#f1c40f').setTitle('Berhasil Kabur!').setDescription('Anda berhasil melarikan diri dari pertarungan.');
            } else {
                finalEmbed.setColor('#95a5a6').setTitle('Pertarungan Berakhir').setDescription('Anda terlalu lama dan pertarungan berakhir secara otomatis.');
            }

            savePlayers();

            await battleMessage.edit({ embeds: [finalEmbed], components: [] });
        });
    },
};