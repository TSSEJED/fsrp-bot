const { SlashCommandBuilder } = require('discord.js');

// Create a new command builder for the embed command group
const command = new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Manage embeds in the server');

// Import subcommands
const panelCommand = require('./panel');

// Add subcommands to the command
panelCommand.addSubcommand(command);

// Store subcommands for execution
const subcommands = {
    panel: panelCommand
};

// Export the command data and execute function
module.exports = {
    data: command,
    subcommands,
    
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        
        const subcommandName = interaction.options?.getSubcommand();
        if (!subcommandName) {
            return interaction.reply({ 
                content: 'No subcommand provided!', 
                ephemeral: true 
            });
        }
        
        console.log(`Executing embed ${subcommandName} command`);
        
        // Find and execute the subcommand
        try {
            const subcommand = subcommands[subcommandName];
            if (subcommand?.execute) {
                return await subcommand.execute(interaction);
            } else {
                return interaction.reply({ 
                    content: `Unknown subcommand: ${subcommandName}`, 
                    ephemeral: true 
                });
            }
        } catch (error) {
            console.error(`Error executing subcommand ${subcommandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ 
                    content: `❌ There was an error executing this command: ${error.message}`, 
                    ephemeral: true 
                }).catch(console.error);
            }
        }
    },
    
    // Handle interactions (buttons, modals, etc.)
    async handleInteraction(interaction) {
        if (interaction.isButton() && subcommands.panel?.handleButton) {
            return subcommands.panel.handleButton(interaction);
        } else if (interaction.isModalSubmit() && interaction.customId === 'create_embed_modal') {
            return handleEmbedCreation(interaction);
        }
        
        // For any other interaction type, check if it's from the panel
        if (interaction.message?.interaction?.commandName === 'embed' && 
            interaction.message?.interaction?.commandType === 1) { // 1 = CHAT_INPUT
            // This is from our panel, allow it
            return;
        }
        
        // Otherwise, block the interaction
        return interaction.reply({
            content: '❌ This command can only be used through the embed panel.',
            ephemeral: true
        });
    }
};

// Handle embed creation from modal
async function handleEmbedCreation(interaction) {
    try {
        // Ensure we have all required fields
        if (!interaction.fields || !interaction.fields.fields) {
            throw new Error('No form data received');
        }

        const name = interaction.fields.getTextInputValue('embed_name')?.trim();
        const title = interaction.fields.getTextInputValue('embed_title')?.trim();
        const description = interaction.fields.getTextInputValue('embed_description')?.trim();
        
        // Validate inputs
        if (!name || !title || !description) {
            throw new Error('All fields are required');
        }

        // Clean and validate the name
        const cleanName = name
            .toLowerCase()
            .replace(/[^a-z0-9_\s-]/g, '') // Remove special chars
            .trim()
            .replace(/[\s-]+/g, '_'); // Replace spaces and hyphens with underscores
            
        if (!cleanName) {
            throw new Error('Please provide a valid embed name');
        }
        
        const embedData = {
            title,
            description,
            color: 0x0099ff // Let Discord.js handle the timestamp automatically
        };
        
        // Try to save the embed with the cleaned name
        const success = setEmbed(cleanName, embedData);
        
        if (!success) {
            throw new Error('Failed to save embed. The name might already be in use.');
        }
        
        // Acknowledge the interaction first
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
        }
        
        // Send success message with the actual command to use
        await interaction.editReply({
            content: `✅ Successfully created embed! Use \`!${cleanName}\` to display it.`,
            ephemeral: true
        });
        
        // Update the panel if it exists
        const panelCommand = subcommands['panel'];
        if (panelCommand?.updatePanel) {
            try {
                await panelCommand.updatePanel(interaction);
            } catch (updateError) {
                console.error('Error updating panel:', updateError);
                // Don't fail the whole operation if panel update fails
            }
        }
    } catch (error) {
        console.error('Error in handleEmbedCreation:', error);
        
        // Prepare error message
        let errorMessage = '❌ An error occurred while creating the embed.';
        if (error.message) {
            errorMessage = `❌ ${error.message}`;
        }
        
        // Send error message
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        } else if (interaction.deferred) {
            await interaction.editReply({
                content: errorMessage
            });
        } else {
            await interaction.followUp({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
}
