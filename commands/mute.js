const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getMember('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot has permission to mute
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: "I don't have permission to mute members.", 
                ephemeral: true 
            });
        }

        // Parse duration
        const time = parseDuration(duration);
        if (!time) {
            return interaction.reply({ 
                content: 'Please provide a valid duration (e.g., 1h, 30m, 1d)', 
                ephemeral: true 
            });
        }

        // Calculate unmute time
        const unmuteTime = Date.now() + time;

        try {
            // Mute the user
            await user.timeout(time, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('🔇 User Muted')
                .addFields(
                    { name: 'User', value: `${user.user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Duration', value: formatDuration(time), inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // Send DM to the muted user
            await user.send({
                content: `You have been muted in ${interaction.guild.name} for ${formatDuration(time)}.\nReason: ${reason}`
            }).catch(() => console.log("Couldn't DM user."));

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error muting this user!', 
                ephemeral: true 
            });
        }
    },
};

// Helper function to parse duration string into milliseconds
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([mhd])/);
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'm': return amount * 60 * 1000; // minutes
        case 'h': return amount * 60 * 60 * 1000; // hours
        case 'd': return amount * 24 * 60 * 60 * 1000; // days
        default: return null;
    }
}

// Helper function to format milliseconds into human-readable string
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}
