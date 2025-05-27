const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!user) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user in this server!", 
                ephemeral: true 
            });
        }

        if (!user.kickable) {
            return interaction.reply({ 
                content: '❌ I cannot kick this user! They may have a higher role than me.', 
                ephemeral: true 
            });
        }

        const kickEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('👢 User Kicked')
            .addFields(
                { name: 'User', value: `${user.user.tag} (${user.id})`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp()
            .setFooter({ text: 'Florida State Roleplay - Moderation' });

        try {
            await user.send(`You have been kicked from ${interaction.guild.name} for: ${reason}`).catch(() => {});
            await user.kick(reason);
            await interaction.reply({ embeds: [kickEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error kicking this user!', 
                ephemeral: true 
            });
        }
    },
};
