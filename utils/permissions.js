const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Configuration
const CONFIG = {
    // The single admin role ID
    ADMIN_ROLE_ID: '1308724851497762837',
    
    // Public commands that anyone can use
    PUBLIC_COMMANDS: ['me', 'do', 'try', 'roll'],
    
    // Guild ID where the bot operates
    GUILD_ID: '1271521823259099138'
};

/**
 * Check if a user has permission to use a command
 * @param {Interaction} interaction - The interaction object
 * @returns {boolean|Promise<boolean>} - True if allowed, false otherwise
 */
function hasPermission(interaction) {
    // Debug info
    console.log(`[PERM] Checking permissions for ${interaction.user.tag} (${interaction.user.id})`);
    console.log(`[PERM] Command: ${interaction.commandName}`);
    console.log(`[PERM] Guild: ${interaction.guild?.name || 'DM'} (${interaction.guildId})`);
    
    // Allow all commands in DMs (if needed)
    if (!interaction.inGuild()) {
        console.log('[PERM] Allowed: In DMs');
        return true;
    }
    
    // Check if this is the correct guild
    if (interaction.guildId !== CONFIG.GUILD_ID) {
        console.log(`[PERM] Denied: Wrong guild (${interaction.guildId})`);
        return false;
    }
    
    // Allow public commands for everyone
    if (CONFIG.PUBLIC_COMMANDS.includes(interaction.commandName)) {
        console.log('[PERM] Allowed: Public command');
        return true;
    }
    
    // Check if member has the admin role
    return interaction.guild.members.fetch(interaction.user.id)
        .then(member => {
            const hasAdminRole = member.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
            console.log(`[PERM] User has admin role (${CONFIG.ADMIN_ROLE_ID}): ${hasAdminRole}`);
            
            if (!hasAdminRole) {
                console.log(`[PERM] User roles:`, 
                    member.roles.cache.map(r => `${r.name} (${r.id})`).join(', ')
                );
            }
            
            return hasAdminRole;
        })
        .catch(error => {
            console.error('[PERM] Error checking permissions:', error);
            return false;
        });
}

/**
 * Middleware to check permissions before executing a command
 * @param {Interaction} interaction - The interaction object
 * @param {Function} next - The next function to call if permission is granted
 */
async function checkPermissions(interaction, next) {
    if (hasPermission(interaction)) {
        return next();
    } else {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Permission Denied')
            .setDescription('You do not have permission to use this command.')
            .setFooter({ text: 'Florida State Roleplay' });

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}

/**
 * Check if a user has admin permissions
 * @param {GuildMember} member - The guild member to check
 * @returns {boolean} - True if user is admin
 */
function isAdmin(member) {
    if (!member) return false;
    if (!member.roles?.cache) return false;
    return member.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
}

/**
 * Middleware to check if user is admin
 * @param {Interaction} interaction - The interaction object
 * @param {Function} next - The next function to call if permission is granted
 */
async function checkAdmin(interaction, next) {
    try {
        // Make sure we have a valid interaction and member
        if (!interaction || !interaction.member) {
            console.error('Invalid interaction or member in checkAdmin');
            return false;
        }

        // Fetch member if partial
        const member = interaction.member.partial 
            ? await interaction.member.fetch() 
            : interaction.member;

        if (isAdmin(member)) {
            return next();
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setFooter({ text: 'Florida State Roleplay' });

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return false;
        }
    } catch (error) {
        console.error('Error in checkAdmin:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: '❌ An error occurred while checking permissions.', 
                ephemeral: true 
            }).catch(console.error);
        }
        return false;
    }
}

module.exports = {
    hasPermission,
    checkPermissions,
    checkAdmin,
    isAdmin,
    CONFIG
};
