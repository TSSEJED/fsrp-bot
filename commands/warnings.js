const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// In-memory storage for warnings (you might want to use a database in production)
const warnings = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view warnings for')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const userWarnings = warnings.get(user.id) || [];
        
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();
            
        if (userWarnings.length === 0) {
            embed.setDescription('This user has no warnings.');
        } else {
            embed.setDescription(`**Total Warnings:** ${userWarnings.length}\n\n` +
                userWarnings.map((warn, index) => 
                    `**#${index + 1}** - ${warn.reason} (${new Date(warn.timestamp).toLocaleString()})`
                ).join('\n')
            );
        }
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

// Helper function to add warnings (used by warn command)
function addWarning(userId, reason) {
    if (!warnings.has(userId)) {
        warnings.set(userId, []);
    }
    warnings.get(userId).push({
        reason,
        timestamp: Date.now()
    });
    return warnings.get(userId).length; // Return total warnings
}

// Export the addWarning function for use in warn command
module.exports.addWarning = addWarning;
