const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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
                .setDescription('Reason for the kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the user is kickable
        if (!member.kickable) {
            return interaction.reply({ 
                content: 'I cannot kick this user. They may have a higher role than me or be the server owner.', 
                ephemeral: true 
            });
        }

        try {
            // Send DM before kicking
            await user.send({
                content: `You have been kicked from ${interaction.guild.name}.\nReason: ${reason}`
            }).catch(() => console.log("Couldn't DM user."));

            // Kick the user
            await member.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#ff3333')
                .setTitle('👢 User Kicked')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error kicking this user!', 
                ephemeral: true 
            });
        }
    },
};
