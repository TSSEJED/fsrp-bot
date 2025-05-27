const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { removeEmbed, getEmbed, listEmbeds } = require('../../utils/embedManager');
const { checkAdmin } = require('../../utils/permissions');

// This function adds the subcommand to the main command
module.exports.addSubcommand = (command) => {
    return command.addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove an existing embed')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Name of the embed to remove')
                    .setRequired(true)
                    .setAutocomplete(true))
    );
};

// Autocomplete for embed names
module.exports.autocomplete = async function(interaction) {
    try {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const embeds = listEmbeds();
        
        const filtered = embeds
            .filter(embed => embed.toLowerCase().includes(focusedValue))
            .slice(0, 25);
            
        await interaction.respond(
            filtered.map(choice => ({
                name: choice,
                value: choice
            }))
        );
    } catch (error) {
        console.error('Error in autocomplete:', error);
    }
};

// The execute function for this subcommand
module.exports.execute = async function(interaction) {
    // Check admin permissions
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) return;
    const name = interaction.options.getString('name');
    const embed = getEmbed(name);
    
    if (!embed) {
        return interaction.reply({ 
            content: `❌ No embed found with the name "${name}".`,
            ephemeral: true 
        });
    }
    
    const success = removeEmbed(name);
    
    if (success) {
        const responseEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('✅ Embed Removed')
            .setDescription(`The embed "${name}" has been successfully removed.`)
            .setTimestamp();
            
        await interaction.reply({ 
            embeds: [responseEmbed],
            ephemeral: true 
        });
    } else {
        await interaction.reply({ 
            content: '❌ An error occurred while removing the embed.', 
            ephemeral: true 
        });
    }
};
