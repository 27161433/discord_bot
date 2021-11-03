const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { dev_clientId, guildId, asup_00 } = require('./config.json');

const commands = [];


const rest = new REST({ version: '9' }).setToken(asup_00);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(dev_clientId, guildId),
            { body: commands },
        );

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();