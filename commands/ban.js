const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;

        if (!user) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user!", 
                ephemeral: true 
            });
        }

        const member = interaction.guild.members.cache.get(user.id);
        if (member && !member.bannable) {
            return interaction.reply({ 
                content: '❌ I cannot ban this user! They may have a higher role than me.', 
                ephemeral: true 
            });
        }

        const banEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔨 User Banned')
            .addFields(
                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Messages Deleted', value: `${days} days`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Florida State Roleplay - Moderation' });

        try {
            await user.send(`You have been banned from ${interaction.guild.name} for: ${reason}`).catch(() => {});
            await interaction.guild.members.ban(user, { 
                days: days,
                reason: reason 
            });
            await interaction.reply({ embeds: [banEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error banning this user!', 
                ephemeral: true 
            });
        }
    },
};
