const { Events, ActivityType } = require('discord.js');
const { spawnGate } = require('../utils/gateManager');

const GATE_SPAWN_INTERVAL = 10 * 60 * 1000; // 10 menit

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Siap! Login sebagai ${client.user.tag}`);
        console.log("Senātus Populusque Rōmānus!"); // The Senate and People of Rome!
		client.user.setPresence({
			activities: [{
				name: "the Empire Yapping",
				type: ActivityType.Streaming,
				url: "hhttps://www.twitch.tv/deyohhh_?sr=a" // Ganti dengan URL Twitch/YouTube Anda
			}],
			status: 'online'
		});

		// Mulai siklus spawn gate
        console.log('Memulai siklus spawn Gate...');
        // Panggil sekali saat bot siap, lalu set interval
        spawnGate(client);
        setInterval(() => spawnGate(client), GATE_SPAWN_INTERVAL);
	},
};