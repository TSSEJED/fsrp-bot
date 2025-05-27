const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear a specified number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Clear messages from a specific user')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ 
                content: 'Please provide a number between 1 and 100!', 
                ephemeral: true 
            });
        }

        try {
            let messages = await interaction.channel.messages.fetch({ limit: amount });
            
            if (user) {
                messages = messages.filter(m => m.author.id === user.id);
                if (messages.size === 0) {
                    return interaction.reply({ 
                        content: `No messages found from ${user.tag} in the last ${amount} messages.`,
                        ephemeral: true 
                    });
                }
            }

            const deletedMessages = await interaction.channel.bulkDelete(messages, true);
            
            const clearEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🗑️ Messages Cleared')
                .addFields(
                    { name: 'Amount', value: `${deletedMessages.size} messages`, inline: true },
                    { name: 'Channel', value: `${interaction.channel}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Florida State Roleplay - Moderation' });

            const reply = await interaction.reply({ 
                embeds: [clearEmbed],
                fetchReply: true 
            });

            // Delete the success message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);

        } catch (error) {
            console.error(error);
            if (error.code === 50034) {
                return interaction.reply({ 
                    content: '❌ You can only bulk delete messages that are under 14 days old!', 
                    ephemeral: true 
                });
            }
            await interaction.reply({ 
                content: 'There was an error trying to clear messages in this channel!', 
                ephemeral: true 
            });
        }
    },
};
