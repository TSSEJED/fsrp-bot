const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setEmbed } = require('../../utils/embedManager');
const { checkAdmin } = require('../../utils/permissions');

// This function adds the subcommand to the main command
module.exports.addSubcommand = (command) => {
    return command.addSubcommand(subcommand =>
        subcommand
            .setName('set')
            .setDescription('Create or update an embed')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Name of the embed (used with !command)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('Title of the embed')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description of the embed')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('color')
                    .setDescription('Color of the embed (hex code, e.g., #0099ff)')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('footer')
                    .setDescription('Footer text')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('thumbnail')
                    .setDescription('URL of the thumbnail')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('image')
                    .setDescription('URL of the main image')
                    .setRequired(false))
    );
};

// The execute function for this subcommand
module.exports.execute = async function(interaction) {
    // Check admin permissions
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) return;
    const name = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || '#0099ff';
    const footer = interaction.options.getString('footer');
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');
            
    // Validate color
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!colorRegex.test(color)) {
        return interaction.reply({ 
            content: '❌ Invalid color format. Please use a valid hex color code (e.g., #0099ff).',
            ephemeral: true 
        });
    }
            
    // Create embed data
    const embedData = {
        title,
        description,
        color: parseInt(color.replace('#', '0x'), 16),
        footer: footer ? { text: footer } : null,
        thumbnail,
        image
    };
    
    // Save the embed
    const success = setEmbed(name, embedData);
    
    if (success) {
        const embed = new EmbedBuilder()
            .setColor(embedData.color)
            .setTitle('✅ Embed Saved')
            .setDescription(`The embed "${name}" has been saved.`)
            .addFields(
                { name: 'Title', value: title, inline: true },
                { name: 'Preview', value: `Use \`!${name}\` to display this embed` }
            )
            .setTimestamp();
        
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (footer) embed.setFooter({ text: footer });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        await interaction.reply({ 
            content: '❌ An error occurred while saving the embed.', 
            ephemeral: true 
        });
    }
};
