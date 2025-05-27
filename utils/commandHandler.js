const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
        }
    }
}

async function deployCommands(commands, clientId, guildId) {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log(`Started refreshing ${commands.size} application (/) commands.`);

        const data = await rest.put(
            guildId 
                ? Routes.applicationGuildCommands(clientId, guildId)
                : Routes.applicationCommands(clientId),
            { body: commands.map(command => command.data.toJSON()) },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { loadCommands, deployCommands };
