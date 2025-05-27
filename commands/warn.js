const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user in the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const warnEmbed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('⚠️ User Warned')
            .addFields(
                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp()
            .setFooter({ text: 'Florida State Roleplay - Moderation' });

        try {
            await interaction.reply({ embeds: [warnEmbed] });
            await user.send(`You have been warned in ${interaction.guild.name} for: ${reason}`).catch(() => {});
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error warning this user!', 
                ephemeral: true 
            });
        }
    },
};
