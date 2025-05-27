const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    StringSelectMenuBuilder,
    ComponentType
} = require('discord.js');
const { checkAdmin } = require('../../utils/permissions');

// Color palette for the color picker
const COLOR_PALETTE = [
    { name: 'Red', value: '#ff0000' },
    { name: 'Orange', value: '#ff9900' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Purple', value: '#800080' },
    { name: 'Pink', value: '#ff00ff' },
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#808080' },
];

// This function adds the subcommand to the main command
module.exports.addSubcommand = (command) => {
    return command.addSubcommand(subcommand =>
        subcommand
            .setName('builder')
            .setDescription('Open the advanced embed builder')
    );
};

// Function to create the main builder interface
function createBuilderInterface(embedData = {}) {
    // Default embed data
    const data = {
        title: embedData.title || '',
        description: embedData.description || '',
        color: embedData.color || '#0099ff',
        footer: embedData.footer || { text: 'Florida State Roleplay' },
        thumbnail: embedData.thumbnail || '',
        image: embedData.image || '',
        fields: embedData.fields || []
    };

    // Create the embed preview
    const embed = new EmbedBuilder()
        .setTitle(data.title || '\u200b')
        .setDescription(data.description || '\u200b')
        .setColor(data.color)
        .setFooter({ text: data.footer.text || 'Florida State Roleplay' });

    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    if (data.fields.length > 0) embed.addFields(data.fields);

    // Create action rows
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('builder_title')
            .setLabel('Title')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📝'),
        new ButtonBuilder()
            .setCustomId('builder_description')
            .setLabel('Description')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📄'),
        new ButtonBuilder()
            .setCustomId('builder_color')
            .setLabel('Color')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎨')
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('builder_thumbnail')
            .setLabel('Thumbnail')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🖼️'),
        new ButtonBuilder()
            .setCustomId('builder_image')
            .setLabel('Image')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🖼️'),
        new ButtonBuilder()
            .setCustomId('builder_field')
            .setLabel('Add Field')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➕')
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('builder_save')
            .setLabel('Save Embed')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💾'),
        new ButtonBuilder()
            .setCustomId('builder_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌'),
        new ButtonBuilder()
            .setCustomId('builder_help')
            .setLabel('Help')
            .setStyle(ButtonStyle.Link)
            .setURL('https://example.com/embed-builder-guide')
    );

    return {
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true
    };
}

// Function to create color picker
function createColorPicker() {
    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    // Add color buttons in rows of 5
    COLOR_PALETTE.forEach((color, index) => {
        if (index > 0 && index % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`color_${color.value}`)
                .setLabel(color.name)
                .setStyle(ButtonStyle.Primary)
                .setStyle(ButtonStyle.Secondary)
                .setStyle(color.value === '#000000' ? ButtonStyle.Secondary : ButtonStyle.Primary)
        );
    });
    
    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }
    
    // Add custom color input
    const customRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('custom_color')
            .setLabel('Custom Color (HEX)')
            .setStyle(ButtonStyle.Secondary)
    );
    
    rows.push(customRow);
    
    return {
        content: 'Select a color:',
        components: rows,
        ephemeral: true
    };
}

// The execute function for this subcommand
module.exports.execute = async function(interaction) {
    // Check admin permissions
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) return;

    try {
        await interaction.reply(createBuilderInterface());
    } catch (error) {
        console.error('Error creating embed builder:', error);
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ An error occurred while opening the embed builder.',
                ephemeral: true
            });
        }
    }
};

// Handle modal submissions
module.exports.handleModal = async function(interaction) {
    if (!interaction.isModalSubmit()) return;

    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission to use the embed builder.',
            ephemeral: true
        });
    }

    try {
        const { customId } = interaction;
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        
        if (customId === 'color_modal') {
            const color = interaction.fields.getTextInputValue('color_value');
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                embed.setColor(color);
            } else {
                return interaction.reply({
                    content: '❌ Invalid color format. Please use a valid hex color (e.g., #FF0000).',
                    ephemeral: true
                });
            }
        } 
        else if (customId === 'title_modal') {
            const title = interaction.fields.getTextInputValue('title_value');
            embed.setTitle(title || '\u200b');
        }
        else if (customId === 'description_modal') {
            const description = interaction.fields.getTextInputValue('description_value');
            embed.setDescription(description || '\u200b');
        }
        else if (customId === 'thumbnail_modal') {
            const thumbnail = interaction.fields.getTextInputValue('thumbnail_value');
            if (thumbnail) embed.setThumbnail(thumbnail);
        }
        else if (customId === 'image_modal') {
            const image = interaction.fields.getTextInputValue('image_value');
            if (image) embed.setImage(image);
        }
        else if (customId === 'add_field_modal') {
            const name = interaction.fields.getTextInputValue('field_name');
            const value = interaction.fields.getTextInputValue('field_value');
            const inline = interaction.fields.getTextInputValue('field_inline')?.toLowerCase() === 'true';
            
            if (name && value) {
                embed.addFields({ name, value, inline: inline || false });
            }
        }

        // Update the message with the modified embed
        await interaction.update(createBuilderInterface(embed.data));
    } catch (error) {
        console.error('Error handling modal submission:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your input.',
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                content: '❌ An error occurred while processing your input.',
                ephemeral: true
            });
        }
    }
};

// Handle button interactions
module.exports.handleButton = async function(interaction) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission to use the embed builder.',
            ephemeral: true
        });
    }

    try {
        // Handle different button actions
        if (customId.startsWith('builder_')) {
            const action = customId.split('_')[1];
            
            switch (action) {
                case 'title':
                case 'description':
                case 'thumbnail':
                case 'image':
                    await handleTextInput(interaction, action);
                    break;
                    
                case 'color':
                    await interaction.showModal(createColorModal());
                    break;
                    
                case 'field':
                    await handleAddField(interaction);
                    break;
                    
                case 'save':
                    await handleSaveEmbed(interaction);
                    break;
                    
                case 'cancel':
                    await interaction.update({
                        content: 'Embed creation cancelled.',
                        components: [],
                        embeds: []
                    });
                    break;
                    
                case 'help':
                    // Handled by the link button
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling builder button:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
};

// Helper function to create a color modal
function createColorModal() {
    const modal = new ModalBuilder()
        .setCustomId('color_modal')
        .setTitle('Enter Custom Color');

    const colorInput = new TextInputBuilder()
        .setCustomId('color_value')
        .setLabel('Enter a hex color (e.g., #FF0000)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    const row = new ActionRowBuilder().addComponents(colorInput);
    modal.addComponents(row);
    
    return modal;
}

// Helper function to handle text input
async function handleTextInput(interaction, field) {
    const modal = new ModalBuilder()
        .setCustomId(`${field}_modal`)
        .setTitle(`Edit ${field.charAt(0).toUpperCase() + field.slice(1)}`);

    // Get current embed data
    const currentEmbed = interaction.message.embeds[0];
    let currentValue = '';
    
    // Set current value based on field type
    switch (field) {
        case 'title':
            currentValue = currentEmbed?.title || '';
            break;
        case 'description':
            currentValue = currentEmbed?.description || '';
            break;
        case 'thumbnail':
            currentValue = currentEmbed?.thumbnail?.url || '';
            break;
        case 'image':
            currentValue = currentEmbed?.image?.url || '';
            break;
    }

    // Create appropriate input field
    const input = new TextInputBuilder()
        .setCustomId(field + '_value')
        .setLabel(`Enter the ${field} ${field === 'thumbnail' || field === 'image' ? 'URL' : 'text'}:`)
        .setStyle(field === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(field !== 'thumbnail' && field !== 'image')
        .setValue(currentValue || '');

    // Add placeholder/help text
    if (field === 'thumbnail' || field === 'image') {
        input.setPlaceholder('https://example.com/image.png');
    } else if (field === 'description') {
        input.setPlaceholder('Enter your embed description here...');
    } else if (field === 'title') {
        input.setPlaceholder('Enter your embed title here...');
    }

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    
    try {
        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error showing modal:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Failed to open the input form.',
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                content: '❌ Failed to open the input form.',
                ephemeral: true
            });
        }
    }
}

// Helper function to handle adding a field
async function handleAddField(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('add_field_modal')
        .setTitle('Add Field');

    const nameInput = new TextInputBuilder()
        .setCustomId('field_name')
        .setLabel('Field Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const valueInput = new TextInputBuilder()
        .setCustomId('field_value')
        .setLabel('Field Value')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const inlineInput = new TextInputBuilder()
        .setCustomId('field_inline')
        .setLabel('Inline? (true/false)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('true')
        .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(valueInput);
    const row3 = new ActionRowBuilder().addComponents(inlineInput);
    
    modal.addComponents(row1, row2, row3);
    await interaction.showModal(modal);
}

// Helper function to handle saving the embed
async function handleSaveEmbed(interaction) {
    // Get the current embed from the message
    const embed = interaction.message.embeds[0];
    if (!embed) {
        return interaction.reply({
            content: '❌ No embed data found to save.',
            ephemeral: true
        });
    }

    // Here you would typically save the embed to your database
    // For now, we'll just show a success message
    await interaction.update({
        content: '✅ Embed saved successfully!',
        components: [],
        embeds: [embed]
    });
}
