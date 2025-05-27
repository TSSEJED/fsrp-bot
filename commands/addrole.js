const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Add a role to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for adding the role'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

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
                content: "I can't add a role that is higher than or equal to my highest role.", 
                ephemeral: true 
            });
        }

        try {
            // Add the role to the user
            await user.roles.add(role, `${interaction.user.tag}: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Role Added')
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
                content: `You have received the role **${role.name}** in ${interaction.guild.name}.\nReason: ${reason}`
            }).catch(() => console.log("Couldn't DM user."));

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error adding the role!', 
                ephemeral: true 
            });
        }
    },
};
