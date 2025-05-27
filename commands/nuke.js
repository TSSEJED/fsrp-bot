const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('🚨 NUKE COMMAND - Clears all messages in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('confirmation')
                .setDescription('Type "CONFIRM" to clear all messages')
                .setRequired(true)),

    async execute(interaction) {
        // Allowed user IDs
        const allowedUserIds = [
            '1167431109752143873',
            '1226879343964192768',
            '985444871722631199'
        ];

        // Check if user is authorized
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const confirmation = interaction.options.getString('confirmation');
        
        if (confirmation !== 'CONFIRM') {
            return interaction.reply({
                content: '❌ Please type "CONFIRM" to clear all messages in this channel.',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            
            const channel = interaction.channel;
            
            // Fetch all messages in the channel (up to 100 at a time)
            let messages;
            do {
                messages = await channel.messages.fetch({ limit: 100 });
                if (messages.size === 0) break;
                
                // Bulk delete messages (Discord API limit: 14 days old)
                await channel.bulkDelete(messages, true);
                
                // If there are still messages, wait a bit to avoid rate limits
                if (messages.size === 100) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } while (messages.size > 0);
            
            // Send a confirmation message that will be deleted after 5 seconds
            const reply = await interaction.editReply({
                content: '✅ Successfully cleared all messages in this channel!',
                ephemeral: true
            });
            
            // Delete the confirmation message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);
            
        } catch (error) {
            console.error('Error executing nuke command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while trying to clear messages.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ An error occurred while trying to clear messages.',
                    ephemeral: true
                });
            }
        }
    },
};
