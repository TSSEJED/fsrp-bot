require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// Set a timeout for the entire script (increased to 2 minutes)
const SCRIPT_TIMEOUT = 120000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Set script timeout
const timeout = setTimeout(() => {
    console.error('Script timed out. Exiting...');
    process.exit(1);
}, SCRIPT_TIMEOUT);

async function deployCommands() {
    try {
        console.log('🚀 Starting command deployment...');
        
        // Load commands
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        
        // Get command files and filter .js files
        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js'));

        console.log(`📂 Found ${commandFiles.length} command files`);

        // Load commands in parallel
        await Promise.all(commandFiles.map(async (file) => {
            try {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Loaded command: ${file}`);
                } else {
                    console.warn(`⚠️  Skipping ${file}: Missing required properties`);
                }
            } catch (error) {
                console.error(`❌ Error loading command ${file}:`, error.message);
            }
        }));

        if (commands.length === 0) {
            throw new Error('❌ No valid commands found to deploy');
        }

        console.log(`🔄 Deploying ${commands.length} application (/) commands...`);
        
        // Deploy commands with increased timeout
        const rest = new REST({ timeout: 30000 }) // 30 seconds
            .setToken(process.env.TOKEN);
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { 
                body: commands,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Successfully deployed ${data.length} application (/) commands!`);
        clearTimeout(timeout);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to deploy commands:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.method) console.error('Method:', error.method);
        if (error.url) console.error('URL:', error.url);
        clearTimeout(timeout);
        process.exit(1);
    }
}

// Start deployment with error handling
(async () => {
    try {
        await deployCommands();
    } catch (error) {
        console.error('Fatal error in deployment:', error);
        process.exit(1);
    }
})();
