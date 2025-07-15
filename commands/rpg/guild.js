const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../../utils/playerData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Masuki Guild Hall untuk melihat informasi atau mengambil misi.'),
    async execute(interaction) {
        const playerData = getPlayer(interaction.user.id);

        if (!playerData.username) {
            return interaction.reply({
                content: 'Anda belum menjadi anggota. Silakan daftar terlebih dahulu dengan /register.',
                ephemeral: true
            });
        }

        const guildEmbed = new EmbedBuilder()
            .setColor('#c27c0e') // Warna perunggu/kayu
            .setTitle('Selamat Datang di Guild Hall!')
            .setDescription(`Halo, ${playerData.username}! Di sinilah para petualang berkumpul untuk mencari nama dan kekayaan.`)
            .addFields(
                { name: 'Papan Misi', value: 'Saat ini belum ada misi yang tersedia. Cek kembali nanti!', inline: false },
                { name: 'Tavern', value: 'Tempat untuk bersosialisasi dengan petualang lain (fitur segera hadir).', inline: false }
            )
            .setFooter({ text: 'Ave Roma!' });

        await interaction.reply({ embeds: [guildEmbed] });
    },
};