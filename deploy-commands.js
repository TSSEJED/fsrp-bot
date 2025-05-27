require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// Set a timeout for the entire script
const SCRIPT_TIMEOUT = 30000; // 30 seconds

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Set script timeout
const timeout = setTimeout(() => {
    console.error('Script timed out. Exiting...');
    process.exit(1);
}, SCRIPT_TIMEOUT);

async function deployCommands() {
    try {
        console.log('Starting command deployment...');
        
        // Load commands
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        console.log(`Found ${commandFiles.length} command files`);

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)]; // Clear cache
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Loaded command: ${file}`);
                } else {
                    console.warn(`⚠️  The command at ${filePath} is missing required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`❌ Error loading command ${file}:`, error.message);
                continue;
            }
        }

        if (commands.length === 0) {
            throw new Error('No valid commands found to deploy.');
        }

        console.log(`Deploying ${commands.length} application (/) commands...`);
        
        // Deploy commands
        const rest = new REST({ timeout: 10000 }).setToken(process.env.TOKEN);
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        clearTimeout(timeout);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to deploy commands:', error);
        clearTimeout(timeout);
        process.exit(1);
    }
}

// Start deployment
deployCommands();
