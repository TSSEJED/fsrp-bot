const { SlashCommandBuilder, EmbedBuilder, userMention } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id);
        
        if (!member) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user in this server!", 
                ephemeral: true 
            });
        }

        // Calculate account age
        const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
        
        // Calculate server join age
        const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
        
        // Get user status
        const status = member.presence?.status || 'offline';
        const statusEmoji = {
            online: '🟢',
            idle: '🟡',
            dnd: '🔴',
            offline: '⚫'
        }[status];

        // Get user roles (excluding @everyone)
        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .filter(role => role.id !== interaction.guild.roles.everyone.id)
            .map(role => role.toString());

        // Get user permissions
        const permissions = member.permissions.toArray().sort();

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || '#3498db')
            .setAuthor({ 
                name: `${targetUser.tag} ${targetUser.bot ? '🤖' : ''}`, 
                iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
            })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { 
                    name: '👤 User', 
                    value: `${userMention(targetUser.id)} (${targetUser.id})`,
                    inline: true 
                },
                { 
                    name: '📛 Nickname', 
                    value: member.nickname || 'None',
                    inline: true 
                },
                { 
                    name: '🎂 Account Created', 
                    value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>\n(${accountAge} days ago)`,
                    inline: true 
                },
                { 
                    name: '📅 Joined Server', 
                    value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>\n(${joinAge} days ago)`,
                    inline: true 
                },
                { 
                    name: '🚀 Status', 
                    value: `${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}\n` +
                           `${
                               member.presence?.activities[0]?.type === 'CUSTOM' 
                               ? member.presence.activities[0].state || ''
                               : member.presence?.activities[0]?.name || 'No activity'
                           }`,
                    inline: true 
                },
                { 
                    name: `🎭 Roles [${roles.length}]`, 
                    value: roles.length > 0 
                        ? roles.slice(0, 10).join(' ') + (roles.length > 10 ? `\n+${roles.length - 10} more...` : '')
                        : 'No roles',
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Add user banner if available
        if (member.user.bannerURL()) {
            embed.setImage(member.user.bannerURL({ size: 1024 }));
        }

        // Add additional info as fields
        if (member.premiumSince) {
            embed.addFields({
                name: '🌟 Boosting Since',
                value: `<t:${Math.floor(new Date(member.premiumSince).getTime() / 1000)}:R>`,
                inline: true
            });
        }

        if (member.communicationDisabledUntilTimestamp > Date.now()) {
            const timeLeft = Math.ceil((member.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60);
            embed.addFields({
                name: '⏳ Timeout',
                value: `Until: <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R>\n(${timeLeft} minutes left)`,
                inline: true
            });
        }

        // Add permissions field if user has any special permissions
        if (permissions.length > 0) {
            embed.addFields({
                name: '🔑 Key Permissions',
                value: permissions.slice(0, 5).map(p => `• ${p.replace(/_/g, ' ').toLowerCase()}`).join('\n') +
                       (permissions.length > 5 ? `\n+${permissions.length - 5} more...` : ''),
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
