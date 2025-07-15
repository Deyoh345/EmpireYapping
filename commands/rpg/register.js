const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { getPlayer } = require('../../utils/playerData');
const { createClassSelectionImage } = require('../../utils/classSelectionImage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Daftar sebagai warga Kekaisaran Romawi dan pilih jalan hidupmu.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = getPlayer(userId);

        // Cek apakah pemain sudah terdaftar dengan melihat apakah username sudah ada
        if (player.username) {
            return interaction.reply({ content: 'Anda sudah terdaftar sebagai warga Roma!', ephemeral: true });
        }

        await interaction.deferReply();

        const imageBuffer = await createClassSelectionImage();
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'class-selection.png' });

        const gladiatorButton = new ButtonBuilder()
            .setCustomId('register-class-gladiator')
            .setLabel('Gladiator')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:1000590241:1394254674898583635>');

        const mercenaryButton = new ButtonBuilder()
            .setCustomId('register-class-mercenary')
            .setLabel('Mercenary')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:1000590242:1394254708528513085>');

        const merchantButton = new ButtonBuilder()
            .setCustomId('register-class-merchant')
            .setLabel('Merchant')
            .setStyle(ButtonStyle.Success)
            .setEmoji('<:1000590243:1394254729504362566>');

        const magusButton = new ButtonBuilder()
            .setCustomId('register-class-magus')
            .setLabel('Magus')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:1000590244:1394254746793279488>');
        
        const assassinButton = new ButtonBuilder()
            .setCustomId('register-class-assassin')
            .setLabel('Assassin')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:1000590245:1394254761905094767>');

        const rangerButton = new ButtonBuilder()
            .setCustomId('register-class-ranger')
            .setLabel('Ranger')
            .setStyle(ButtonStyle.Success)
            .setEmoji('<:1000590246:1394254775020949566>');

        const paladinButton = new ButtonBuilder()
            .setCustomId('register-class-paladin')
            .setLabel('Paladin')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:1000590247:1394254788929126481>');

        const berserkerButton = new ButtonBuilder()
            .setCustomId('register-class-berserker')
            .setLabel('Berserker')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:1000590248:1394254804095729696>');

        const row1 = new ActionRowBuilder()
            .addComponents(gladiatorButton, mercenaryButton, merchantButton, magusButton);
        
        const row2 = new ActionRowBuilder()
            .addComponents(assassinButton, rangerButton, paladinButton, berserkerButton);

        await interaction.editReply({
            content: `Selamat datang, calon warga Roma! **${interaction.user.username}**, pilih takdirmu dari delapan jalan yang tersedia.`,
            files: [attachment],
            components: [row1, row2]
        });
    },
};
