const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const bosses = require('../data/bosses.json');
const path = require('node:path');
const fs = require('node:fs');

let currentGate = null;

const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];

// Fungsi untuk memunculkan gerbang baru
async function spawnGate(client) {
    const channelId = process.env.GATE_ANNOUNCEMENT_CHANNEL_ID;
    if (!channelId) {
        console.error('[Gate Manager] Peringatan: GATE_ANNOUNCEMENT_CHANNEL_ID tidak diatur di file .env.');
        return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
        console.error(`[Gate Manager] Tidak dapat menemukan channel dengan ID: ${channelId}`);
        return;
    }

    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    // Ambil daftar bos untuk peringkat yang dipilih, lalu pilih satu secara acak
    const bossPool = bosses[rank];
    const boss = bossPool[Math.floor(Math.random() * bossPool.length)];

    currentGate = {
        rank,
        boss: { ...boss }, // Buat salinan data bos
        spawnedAt: new Date(),
        participants: [], // Lacak siapa saja yang sudah masuk
    };

    console.log(`Sebuah gerbang baru telah muncul! Peringkat: ${rank}`);

    // Logika baru: Pilih gambar spesifik berdasarkan data bos
    let attachment;
    let finalImageName;

    if (boss.image) {
        finalImageName = boss.image;
        // Path gambar sekarang: assets/[rank]/[nama_file_gambar].png
        const filePath = path.join(__dirname, '..', 'assets', rank, finalImageName);
        
        if (fs.existsSync(filePath)) {
            attachment = new AttachmentBuilder(filePath, { name: finalImageName });
        } else {
            console.warn(`[Gate Manager] Peringatan: File gambar '${finalImageName}' untuk rank '${rank}' tidak ditemukan di path: ${filePath}`);
        }
    }

    const gateEmbed = new EmbedBuilder()
        .setColor('#8e44ad') // Ungu
        .setTitle(`Sebuah Gerbang Dimensi Terbuka!`)
        .setDescription(`Sebuah gerbang dengan aura berbahaya telah muncul. Para petualang pemberani dipanggil untuk menaklukkannya!`)
        .addFields(
            { name: 'Peringkat Bahaya', value: `**${rank}**`, inline: true },
            { name: 'Energi Terdeteksi', value: `*${boss.name}*`, inline: true }
        )
        .setFooter({ text: 'Gunakan /gate untuk masuk sebelum gerbangnya tertutup!' });

    const messagePayload = { embeds: [gateEmbed] };

    if (attachment && finalImageName) {
        gateEmbed.setImage(`attachment://${finalImageName}`);
        messagePayload.files = [attachment];
    }

    await channel.send(messagePayload);
}

function getGate() {
    return currentGate;
}

function addParticipant(userId) {
    if (currentGate && !currentGate.participants.includes(userId)) {
        currentGate.participants.push(userId);
    }
}

module.exports = {
    spawnGate,
    getGate,
    addParticipant,
};