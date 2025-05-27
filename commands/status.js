const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check bot status and subscription information'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF69B4') // Pink color
            .setTitle('Bot Status & Subscription')
            .setDescription('This is a basic bot subscription. For more information or to upgrade, please contact us!')
            .addFields(
                { name: 'Current Plan', value: 'Basic Bot Subscription', inline: true },
                { name: 'Status', value: 'Active ✅', inline: true },
                { name: 'Support', value: 'Contact: Sejed Tarbellsi', inline: false },
                { name: 'Join Our Server', value: '[Pink Diamond Design](https://discord.gg/wFxMRyVM3y)', inline: false },
                { name: 'Shop', value: 'Visit our server for more items in the shop!', inline: false }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'Thank you for using our bot!', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        try {
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending status message:', error);
            // Fallback in case embed fails
            await interaction.reply({
                content: `**Bot Status**\n\n` +
                    `Current Plan: Basic Bot Subscription\n` +
                    `Status: Active ✅\n\n` +
                    `For more information, please join our server:\n` +
                    `https://discord.gg/wFxMRyVM3y`,
                ephemeral: true
            });
        }
    },
};
