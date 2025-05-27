require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    // Your bot's application ID
    CLIENT_ID: process.env.CLIENT_ID,
    
    // Your bot's token
    TOKEN: process.env.TOKEN,
    
    // The single guild ID where commands should be deployed
    GUILD_ID: '1271521823259099138'
};

// Validate configuration
if (!CONFIG.TOKEN || !CONFIG.CLIENT_ID) {
    console.error('❌ Missing required environment variables:');
    if (!CONFIG.TOKEN) console.error('  - TOKEN is missing');
    if (!CONFIG.CLIENT_ID) console.error('  - CLIENT_ID is missing');
    process.exit(1);
}

console.log(`🚀 Deploying commands to guild ${CONFIG.GUILD_ID}...`);

const commands = [];

const getCommandFiles = (dir) => {
    const files = fs.readdirSync(dir);
    let commandFiles = [];
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            commandFiles = commandFiles.concat(getCommandFiles(fullPath));
        } else if (file.endsWith('.js') && !file.startsWith('_')) {
            commandFiles.push(fullPath);
        }
    }
    return commandFiles;
};

const commandFiles = getCommandFiles(path.join(__dirname, 'commands'));
for (const file of commandFiles) {
    try {
        const command = require(file);
        if (command.data) commands.push(command.data.toJSON());
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

// Create REST client
const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

const cleanupAndDeployCommands = async () => {
    try {
        // First, remove all existing commands
        console.log('🔍 Fetching existing commands...');
        const existingCommands = await rest.get(
            Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID)
        );
        
        console.log(`🗑️  Found ${existingCommands.length} existing commands to remove...`);
        
        // Delete all existing commands
        const deletePromises = existingCommands.map(command => 
            rest.delete(
                Routes.applicationGuildCommand(CONFIG.CLIENT_ID, CONFIG.GUILD_ID, command.id)
            )
        );
        
        await Promise.all(deletePromises);
        console.log('✅ Successfully removed all existing commands.');
        
        // Now deploy the new commands
        console.log(`🔄 Deploying ${commands.length} new application (/) commands...`);
        
        const data = await rest.put(
            Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
            { body: commands },
        );
        
        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        console.log(`🌐 Commands are now available in the specified guild.`);
    } catch (error) {
        console.error('Error:', error);
    }
};

// Run the cleanup and deployment
cleanupAndDeployCommands();