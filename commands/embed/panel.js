const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');
const { listEmbeds } = require('../../utils/embedManager');
const { checkAdmin } = require('../../utils/permissions');

// This function adds the subcommand to the main command
module.exports.addSubcommand = (command) => {
    return command.addSubcommand(subcommand =>
        subcommand
            .setName('panel')
            .setDescription('Create an interactive embed management panel')
    );
};

// Function to create the panel embed
function createPanelEmbed(embeds = []) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Embed Management Panel')
        .setDescription('Use the buttons below to manage embeds')
        .setThumbnail('https://fsrp-staff.pages.dev/logo.png') // Replace with your server's icon URL
        .setTimestamp()
        .setFooter({ 
            text: 'Florida State Roleplay', 
            iconURL: 'https://fsrp-staff.pages.dev/logo.png' // Replace with your server's icon URL
        });

    if (embeds.length > 0) {
        embed.addFields({
            name: 'Available Embeds',
            value: embeds.map(e => `• \`${e}\``).join('\n') || 'No embeds found',
            inline: true
        });
    }

    return embed;
}

// Function to create action rows with buttons
function createActionRows() {
    // First row: Main actions
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('embed_create')
                .setLabel('Create')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('embed_list')
                .setLabel('List')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📜'),
            new ButtonBuilder()
                .setCustomId('embed_remove')
                .setLabel('Remove')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')
        );

    // Second row: Utility and help
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('refresh_panel')
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setURL('https://coming-soon-fsrp.pages.dev/')
                .setLabel('Help')
                .setStyle(ButtonStyle.Link)
                .setEmoji('❔')
        );

    return [row1, row2];
}

// Function to update the panel message
async function updatePanel(interaction) {
    try {
        const embeds = listEmbeds();
        const panelEmbed = createPanelEmbed(embeds);
        const actionRows = createActionRows();

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                embeds: [panelEmbed],
                components: actionRows
            });
        } else {
            await interaction.reply({
                embeds: [panelEmbed],
                components: actionRows,
                ephemeral: false
            });
        }
        return true;
    } catch (error) {
        console.error('Error updating panel:', error);
        return false;
    }
}

// The execute function for this subcommand
module.exports.execute = async function(interaction) {
    // Check admin permissions
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) return;

    try {
        await updatePanel(interaction);
    } catch (error) {
        console.error('Error creating embed panel:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while creating the embed panel.',
                ephemeral: true
            });
        }
    }
};

// Export the updatePanel function for use in other files
module.exports.updatePanel = updatePanel;

// Handle button interactions
module.exports.handleButton = async function(interaction) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;
    const hasPermission = await checkAdmin(interaction, () => true);
    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission to use this panel.',
            ephemeral: true
        });
    }

    try {
        switch (customId) {
            case 'embed_create':
                try {
                    await interaction.showModal(createEmbedModal());
                } catch (error) {
                    console.error('Error showing modal:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Failed to open the embed creation form.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: '❌ Failed to open the embed creation form.',
                            ephemeral: true
                        });
                    }
                }
                break;
                
            case 'embed_list':
                try {
                    const embeds = listEmbeds();
                    const embedList = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📜 Available Embeds')
                        .setDescription(embeds.length > 0 
                            ? embeds.map(e => `• \`${e}\``).join('\n')
                            : 'No embeds have been created yet.')
                        .setTimestamp();
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            embeds: [embedList], 
                            ephemeral: true 
                        });
                    } else {
                        await interaction.followUp({ 
                            embeds: [embedList], 
                            ephemeral: true 
                        });
                    }
                } catch (error) {
                    console.error('Error listing embeds:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Failed to list embeds.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: '❌ Failed to list embeds.',
                            ephemeral: true
                        });
                    }
                }
                break;
                
            case 'embed_remove':
                try {
                    const embeds = listEmbeds();
                    if (embeds.length === 0) {
                        if (!interaction.replied && !interaction.deferred) {
                            return interaction.reply({
                                content: '❌ No embeds available to remove.',
                                ephemeral: true
                            });
                        } else {
                            return interaction.followUp({
                                content: '❌ No embeds available to remove.',
                                ephemeral: true
                            });
                        }
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('embed_remove_select')
                                .setPlaceholder('Select an embed to remove')
                                .addOptions(
                                    embeds.map(embed => ({
                                        label: embed.length > 25 ? embed.substring(0, 22) + '...' : embed,
                                        value: embed,
                                        description: `Remove the "${embed}" embed`
                                    }))
                                )
                        );

                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'Select an embed to remove:',
                            components: [row],
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: 'Select an embed to remove:',
                            components: [row],
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    console.error('Error preparing embed removal:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Failed to prepare embed removal.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: '❌ Failed to prepare embed removal.',
                            ephemeral: true
                        });
                    }
                }
                break;
                
            case 'refresh_panel':
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferUpdate();
                    }
                    await updatePanel(interaction);
                } catch (error) {
                    console.error('Error refreshing panel:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Failed to refresh the panel.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: '❌ Failed to refresh the panel.',
                            ephemeral: true
                        });
                    }
                }
                break;
                
            default:
                console.log(`Unknown button interaction: ${customId}`);
                await interaction.followUp({
                    content: '❌ This button is not implemented yet.',
                    ephemeral: true
                });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
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

// Function to create the embed creation modal
function createEmbedModal() {
    const modal = new ModalBuilder()
        .setCustomId('create_embed_modal')
        .setTitle('Create New Embed');

    // Add components to modal
    const nameInput = new TextInputBuilder()
        .setCustomId('embed_name')
        .setLabel('Embed Name (used with !command)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const titleInput = new TextInputBuilder()
        .setCustomId('embed_title')
        .setLabel('Embed Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('embed_description')
        .setLabel('Embed Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(titleInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    return modal;
}
