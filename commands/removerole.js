const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove the role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing the role'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the user has the role
        if (!user.roles.cache.has(role.id)) {
            return interaction.reply({ 
                content: 'This user does not have the specified role.', 
                ephemeral: true 
            });
        }

        // Check if the bot has permission to manage roles
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ 
                content: "I don't have permission to manage roles.", 
                ephemeral: true 
            });
        }

        // Check if the role is higher than the bot's highest role
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ 
                content: "I can't remove a role that is higher than or equal to my highest role.", 
                ephemeral: true 
            });
        }

        try {
            // Remove the role from the user
            await user.roles.remove(role, `${interaction.user.tag}: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('❌ Role Removed')
                .addFields(
                    { name: 'User', value: `${user.user.tag}`, inline: true },
                    { name: 'Role', value: `${role}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}` },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Send DM to the user
            await user.send({
                content: `The role **${role.name}** has been removed from you in ${interaction.guild.name}.\nReason: ${reason}`
            }).catch(() => console.log("Couldn't DM user."));

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error removing the role!', 
                ephemeral: true 
            });
        }
    },
};
