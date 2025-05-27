const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all roles in the server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get information about a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to get info about')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'add') {
            await this.handleAdd(interaction);
        } else if (subcommand === 'remove') {
            await this.handleRemove(interaction);
        } else if (subcommand === 'list') {
            await this.handleList(interaction);
        } else if (subcommand === 'info') {
            await this.handleInfo(interaction);
        }
    },

    async handleAdd(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to manage roles!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!user) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user in this server!", 
                ephemeral: true 
            });
        }

        if (user.roles.cache.has(role.id)) {
            return interaction.reply({ 
                content: `❌ ${user.user.tag} already has the ${role.name} role!`, 
                ephemeral: true 
            });
        }

        try {
            await user.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Role Added')
                .addFields(
                    { name: 'User', value: user.user.tag, inline: true },
                    { name: 'Role', value: role.name, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Florida State Roleplay - Role Management' });

            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error adding the role! Make sure the role is lower than my highest role and I have permission to manage it.', 
                ephemeral: true 
            });
        }
    },

    async handleRemove(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to manage roles!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!user) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user in this server!", 
                ephemeral: true 
            });
        }

        if (!user.roles.cache.has(role.id)) {
            return interaction.reply({ 
                content: `❌ ${user.user.tag} doesn't have the ${role.name} role!`, 
                ephemeral: true 
            });
        }

        try {
            await user.roles.remove(role);
            
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('❌ Role Removed')
                .addFields(
                    { name: 'User', value: user.user.tag, inline: true },
                    { name: 'Role', value: role.name, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Florida State Roleplay - Role Management' });

            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error removing the role! Make sure the role is lower than my highest role and I have permission to manage it.', 
                ephemeral: true 
            });
        }
    },

    async handleList(interaction) {
        const roles = interaction.guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .filter(role => role.name !== '@everyone')
            .map(role => `${role} - ${role.members.size} members`);

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('👥 Server Roles')
            .setDescription(roles.join('\n') || 'No roles found')
            .setFooter({ text: `Total Roles: ${roles.length}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleInfo(interaction) {
        const role = interaction.options.getRole('role');
        
        const members = role.members.map(member => member.user.tag);
        
        const embed = new EmbedBuilder()
            .setColor(role.hexColor)
            .setTitle(`ℹ️ Role Info: ${role.name}`)
            .addFields(
                { name: 'ID', value: role.id, inline: true },
                { name: 'Color', value: role.hexColor, inline: true },
                { name: 'Position', value: role.position.toString(), inline: true },
                { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
                { 
                    name: `Members [${role.members.size}]`, 
                    value: members.length > 0 
                        ? members.slice(0, 10).join('\n') + (members.length > 10 ? `\n...and ${members.length - 10} more` : '')
                       : 'No members with this role',
                    inline: false 
                }
            )
            .setFooter({ text: 'Florida State Roleplay - Role Information' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
