const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),
    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position);
        
        // Calculate verification level text
        const verificationLevels = {
            'NONE': 'None',
            'LOW': 'Low',
            'MEDIUM': 'Medium',
            'HIGH': 'High',
            'VERY_HIGH': 'Highest'
        };

        const verificationLevel = verificationLevels[guild.verificationLevel] || guild.verificationLevel;
        
        // Calculate channel counts
        const channelCounts = {
            text: channels.filter(c => c.type === 0).size,
            voice: channels.filter(c => c.type === 2).size,
            categories: channels.filter(c => c.type === 4).size,
            announcements: channels.filter(c => c.type === 5).size,
            stages: channels.filter(c => c.type === 13).size,
            forums: channels.filter(c => c.type === 15).size
        };

        // Calculate member statuses
        const members = await guild.members.fetch();
        const memberStatuses = {
            online: members.filter(m => m.presence?.status === 'online').size,
            idle: members.filter(m => m.presence?.status === 'idle').size,
            dnd: members.filter(m => m.presence?.status === 'dnd').size,
            offline: members.filter(m => !m.presence?.status || m.presence.status === 'offline').size
        };

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || '')
            .addFields(
                { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { 
                    name: '👥 Members', 
                    value: `Total: ${guild.memberCount}\n` +
                           `👤 Humans: ${members.filter(m => !m.user.bot).size}\n` +
                           `🤖 Bots: ${members.filter(m => m.user.bot).size}`, 
                    inline: true 
                },
                { 
                    name: '📊 Status', 
                    value: `🟢 ${memberStatuses.online} Online\n` +
                           `🟡 ${memberStatuses.idle} Idle\n` +
                           `🔴 ${memberStatuses.dnd} DND\n` +
                           `⚫ ${memberStatuses.offline} Offline`,
                    inline: true 
                },
                { 
                    name: '📚 Channels', 
                    value: `💬 ${channelCounts.text} Text\n` +
                           `🔊 ${channelCounts.voice} Voice\n` +
                           `📁 ${channelCounts.categories} Categories\n` +
                           `📢 ${channelCounts.announcements} Announcements`,
                    inline: true 
                },
                { 
                    name: '🔒 Verification', 
                    value: `Level: ${verificationLevel}\n` +
                           `Boosts: ${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier || 0})`,
                    inline: true 
                },
                { 
                    name: '📜 Roles', 
                    value: `${roles.size} roles`,
                    inline: true 
                },
                { 
                    name: '🚀 Features', 
                    value: guild.features.length > 0 
                        ? guild.features.map(f => `• ${f.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}`).join('\n')
                        : 'No special features',
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Add server banner if available
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }

        await interaction.reply({ embeds: [embed] });
    },
};
