const { REST, Routes } = require('discord.js');
require('dotenv').config();
const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Ambil semua folder command dari direktori commands
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    // Ambil semua file command dari direktori command
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    // Ambil data SlashCommand dari setiap file command
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[PERINGATAN] Command di ${filePath} tidak memiliki properti "data" atau "execute".`);
        }
    }
}

// Buat instance dari modul REST
const rest = new REST().setToken(TOKEN);

// dan deploy command Anda!
(async () => {
	try {
		console.log(`Memulai refresh ${commands.length} application (/) commands.`);

		// Method put digunakan untuk me-refresh semua command di guild dengan set yang baru
		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Berhasil memuat ulang ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();