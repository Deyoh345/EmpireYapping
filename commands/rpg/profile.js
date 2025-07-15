const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createProfileImage } = require('../../utils/profileImage');
const { getPlayer } = require('../../utils/playerData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Lihat profil karakter Romawi Anda atau orang lain.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Warga yang profilnya ingin Anda lihat.')
                .setRequired(false)),
    async execute(interaction) {
        // Menunda balasan karena pembuatan gambar butuh waktu
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target') || interaction.user;
        const playerData = getPlayer(targetUser.id);

        // Cek apakah pemain sudah terdaftar dengan melihat apakah username sudah ada
        if (!playerData.username) {
            return interaction.editReply({
                content: `${targetUser.username} belum terdaftar sebagai warga Roma. Gunakan /register untuk mendaftar.`,
                ephemeral: true
            });
        }

        // Membuat gambar profil
        const buffer = await createProfileImage(targetUser, playerData);
        // Mengubah buffer gambar menjadi lampiran Discord
        const attachment = new AttachmentBuilder(buffer, { name: 'profile-card.png' });

        // Mengirim gambar sebagai balasan
        await interaction.editReply({ files: [attachment] });
    },
};
