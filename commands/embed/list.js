const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listEmbeds } = require('../../utils/embedManager');
const { checkAdmin } = require('../../utils/permissions');

// This function adds the subcommand to the main command
module.exports.addSubcommand = (command) => {
    return command.addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all available embeds')
    );
};

// The execute function for this subcommand
module.exports.execute = async function(interaction) {
    // Check admin permissions
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) return;
    const embeds = listEmbeds();
    
    if (embeds.length === 0) {
        return interaction.reply({ 
            content: '❌ No embeds have been created yet.',
            ephemeral: true 
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📜 Available Embeds')
        .setDescription('Here are all the available embeds. Use `![name]` to display them.')
        .addFields(
            { 
                name: 'Embed Commands', 
                value: embeds.map(e => `• \`!${e}\``).join('\n'),
                inline: true 
            }
        )
        .setTimestamp()
        .setFooter({ text: `Total: ${embeds.length} embeds` });
        
    await interaction.reply({ embeds: [embed], ephemeral: true });
};
