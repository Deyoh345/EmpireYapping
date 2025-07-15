const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
require('dotenv').config();
const { savePlayers } = require('./utils/playerData'); // Impor fungsi savePlayers

const emping = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command Handler
emping.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            emping.commands.set(command.data.name, command);
        } else {
            console.log(`[PERINGATAN] Command di ${filePath} tidak memiliki properti "data" atau "execute".`);
        }
    }
}

// Event Handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		emping.once(event.name, (...args) => event.execute(...args));
	} else {
		emping.on(event.name, (...args) => event.execute(...args));
	}
}

// Menangani graceful shutdown
const gracefulShutdown = () => {
  console.log('Bot sedang menyimpan data sebelum mati...');
  savePlayers();
  console.log('Data berhasil disimpan. Bot akan dimatikan.');
  process.exit(0);
};

// Dengarkan sinyal terminasi
process.on('SIGINT', gracefulShutdown); // Untuk Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Untuk kill command

emping.login(process.env.TOKEN);