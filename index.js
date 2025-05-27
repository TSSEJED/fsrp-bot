require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkPermissions } = require('./utils/permissions');

// Load environment variables safely
const ALLOWED_GUILDS = process.env.ALLOWED_GUILDS || '';
const allowedGuilds = ALLOWED_GUILDS ? ALLOWED_GUILDS.split(',').map(id => id.trim()) : [];

// Log Railway environment information
console.log('🚂 Railway Environment Information:');
console.log(`- Project: ${process.env.RAILWAY_PROJECT_NAME || 'Not available'}`);
console.log(`- Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'Not available'}`);
console.log(`- Service: ${process.env.RAILWAY_SERVICE_NAME || 'Not available'}`);
console.log(`- Private Domain: ${process.env.RAILWAY_PRIVATE_DOMAIN || 'Not available'}`);

// Verify required environment variables
const requiredVars = ['TOKEN', 'CLIENT_ID'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
    ]
});

// Load commands
client.commands = new Collection();

// Function to recursively get all command files
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

// Load all command files
const commandFiles = getCommandFiles(path.join(__dirname, 'commands'));

for (const file of commandFiles) {
    try {
        const command = require(file);
        if (command.data) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${file} is missing a required "data" property.`);
        }
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Florida State Roleplay', { type: 'PLAYING' });
});

// Handle interactions (slash commands, buttons, modals)
client.on('interactionCreate', async interaction => {
    try {
        // Debug: Log channel permissions
        if (interaction.channel && interaction.inGuild()) {
            try {
                const botMember = await interaction.guild.members.fetchMe();
                const permissions = interaction.channel.permissionsFor(botMember);
                
                if (permissions) {
                    console.log('[DEBUG] Bot permissions in channel:', {
                        channelId: interaction.channel.id,
                        channelName: interaction.channel.name,
                        canSendMessages: permissions.has(PermissionFlagsBits.SendMessages),
                        canEmbedLinks: permissions.has(PermissionFlagsBits.EmbedLinks),
                        canReadHistory: permissions.has(PermissionFlagsBits.ReadMessageHistory),
                        canViewChannel: permissions.has(PermissionFlagsBits.ViewChannel),
                        canSendEmbeds: permissions.has(PermissionFlagsBits.EmbedLinks),
                        canUseSlashCommands: permissions.has(PermissionFlagsBits.UseApplicationCommands)
                    });
                } else {
                    console.log('[DEBUG] Could not determine permissions for channel');
                }
            } catch (error) {
                console.error('[DEBUG] Error checking permissions:', error);
            }
        }
        // Handle slash commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Special handling for embed commands
            if (interaction.commandName === 'embed') {
                const embedModule = require('./commands/embed');
                return embedModule.execute(interaction);
            }

            // Handle other commands normally
            await command.execute(interaction);
        } 
        // Handle button clicks and modals
        else if (interaction.isButton() || interaction.isModalSubmit()) {
            // Check if it's an embed panel interaction
            const embedCommand = client.commands.get('embed');
            if (embedCommand?.handleInteraction) {
                return embedCommand.handleInteraction(interaction);
            } else {
                // If no specific handler, but it's a modal submission, handle it
                if (interaction.isModalSubmit()) {
                    return interaction.reply({
                        content: 'This modal submission is not handled.',
                        ephemeral: true
                    });
                }
            }
        }
        // Handle select menu interactions (for embed removal)
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'embed_remove_select') {
                const embedName = interaction.values[0];
                const { removeEmbed } = require('./utils/embedManager');
                
                try {
                    const success = removeEmbed(embedName);
                    if (success) {
                        // Update the original panel if it exists
                        const embedCommand = client.commands.get('embed');
                        if (embedCommand?.updatePanel) {
                            await embedCommand.updatePanel(interaction);
                        }
                        
                        await interaction.reply({
                            content: `✅ Successfully removed embed: \`!${embedName}\``,
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: `❌ Failed to remove embed: \`!${embedName}\``,
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    console.error('Error removing embed:', error);
                    await interaction.reply({
                        content: '❌ An error occurred while removing the embed.',
                        ephemeral: true
                    });
                }
            }
        }
    } catch (error) {
        console.error('=== ERROR DETAILS ===');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Interaction Type:', interaction.type);
        console.error('Command Name:', interaction.commandName);
        console.error('Channel Type:', interaction.channel?.type);
        console.error('Guild ID:', interaction.guild?.id);
        console.error('Channel ID:', interaction.channel?.id);
        console.error('Full Error:', error);
        
        try {
            let errorMessage = 'There was an error processing your request!';
            
            // Handle missing permissions error
            if (error.code === 50013 || error.code === 'MissingPermissions') {
                errorMessage = '❌ I don\'t have the required permissions in this channel. Please ensure I have these permissions:\n' +
                    '- Send Messages\n' +
                    '- Embed Links\n' +
                    '- Read Message History\n' +
                    '- View Channel\n\n' +
                    '**How to fix:**\n' +
                    '1. Right-click the channel\n' +
                    '2. Select "Edit Channel"\n' +
                    '3. Go to "Permissions"\n' +
                    '4. Add my role and enable the above permissions';
            }
            
            const responseOptions = { 
                content: errorMessage,
                ephemeral: true,
                components: []
            };
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(responseOptions).catch(console.error);
            } else if (interaction.isRepliable()) {
                await interaction.followUp(responseOptions).catch(console.error);
            }
        } catch (e) {
            console.error('Failed to send error response:', e);
        }
    }
});

// Handle legacy prefix commands (for backward compatibility)
// Login to Discord with your client's token
client.login(process.env.TOKEN)
    .then(() => console.log('Successfully logged in to Discord'))
    .catch(error => {
        console.error('Failed to log in to Discord:', error);
        process.exit(1);
    });

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Handle embed commands (e.g., !embedname or ![embedname])
    let embedName;
    // Check for ![embedname] format
    const bracketMatch = message.content.match(/^!\[([^\]]+)\]$/);
    if (bracketMatch) {
        embedName = bracketMatch[1].toLowerCase();
    } 
    // Check for !embedname format
    else if (message.content.startsWith('!')) {
        embedName = message.content.slice(1).toLowerCase();
    }
    
    if (embedName) {
        const { getEmbed, createEmbedFromData } = require('./utils/embedManager');
        const embedData = getEmbed(embedName);
        
        if (embedData) {
            try {
                const embed = createEmbedFromData(embedData);
                await message.channel.send({ embeds: [embed] });
                // Delete the command message if possible
                if (message.deletable) {
                    await message.delete().catch(console.error);
                }
            } catch (error) {
                console.error('Error sending embed:', error);
                try {
                    await message.reply({ 
                        content: '❌ An error occurred while sending the embed.', 
                        ephemeral: true 
                    });
                } catch (e) {
                    console.error('Failed to send error message:', e);
                }
            }
        } else {
            try {
                await message.reply({
                    content: `❌ No embed found with the name "${embedName}".`,
                    ephemeral: true
                });
            } catch (e) {
                console.error('Failed to send not found message:', e);
            }
        }
        return;
    }
    
    // Handle other legacy commands
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const { ADMIN_ROLE_ID } = require('./utils/permissions');

    // Handle specific legacy commands
    if (commandName === 'say') {
        // Check if user has the admin role
        if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setFooter({ text: 'Florida State Roleplay' });
            return message.reply({ embeds: [embed] }).catch(console.error);
        }
        
        const sayMessage = args.join(' ');
        if (!sayMessage) {
            return message.reply('Please provide a message to say!').catch(console.error);
        }
        
        try {
            await message.delete().catch(console.error);
            await message.channel.send(sayMessage);
        } catch (error) {
            console.error('Error in say command:', error);
            message.reply('There was an error executing that command!').catch(console.error);
        }
    } else if (commandName === 'commands') {
        // Commands list is public
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📜 Florida State Roleplay - Commands List')
            .setDescription('Here are all the available commands. Use them with `/` prefix.')
            .addFields(
                { name: '🎭 Public Commands', value: '`/me`, `/do`, `/try`, `/roll`', inline: false },
                { name: '👮‍♂️ Admin Commands', value: '`/warn`, `/kick`, `/ban`, `/mute`, `/clear`, `/say`', inline: false },
                { name: '👥 Role Management', value: '`/role add`, `/role remove`, `/role list`, `/roleinfo`', inline: false },
                { name: 'ℹ️ Server Info', value: '`/serverinfo`, `/userinfo`, `/help`', inline: false },
                { name: '🎉 Fun', value: '`/floridafact`, `/weather`, `/8ball`', inline: false },
                { name: '🔧 Utility', value: '`/poll`, `/remind`, `/translate`', inline: false }
            )
            .setFooter({ text: 'Florida State Roleplay Bot', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [helpEmbed] }).catch(console.error);
    }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
