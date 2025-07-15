const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getPlayer } = require('../../utils/playerData');
const { createInventoryImage } = require('../../utils/inventoryImage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inv')
        .setDescription('Lihat inventaris item Anda.'),
    async execute(interaction) {
        const player = getPlayer(interaction.user.id);

        if (!player.username) {
            return interaction.reply({ content: 'Anda harus mendaftar terlebih dahulu! Gunakan `/register`.', ephemeral: true });
        }

        await interaction.deferReply();

        const inventoryItems = Object.keys(player.inventory);
        if (inventoryItems.length === 0) {
            return interaction.editReply('Inventaris Anda kosong.');
        }

        const imageBuffer = await createInventoryImage(player);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'inventory.png' });

        await interaction.editReply({ files: [attachment] });
    },
};