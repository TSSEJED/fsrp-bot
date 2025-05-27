const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('Duration of the mute in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getMember('user');
        const time = interaction.options.getInteger('time');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!user) {
            return interaction.reply({ 
                content: "❌ Couldn't find that user in this server!", 
                ephemeral: true 
            });
        }

        if (!user.moderatable) {
            return interaction.reply({ 
                content: '❌ I cannot mute this user! They may have a higher role than me.', 
                ephemeral: true 
            });
        }

        const muteTime = time * 60 * 1000; // Convert minutes to milliseconds
        const unmuteTime = new Date(Date.now() + muteTime);

        const muteEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔇 User Muted')
            .addFields(
                { name: 'User', value: `${user.user.tag} (${user.id})`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Duration', value: `${time} minutes`, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Unmute Time', value: `<t:${Math.floor(unmuteTime.getTime() / 1000)}:R>` }
            )
            .setTimestamp()
            .setFooter({ text: 'Florida State Roleplay - Moderation' });

        try {
            await user.timeout(muteTime, reason);
            await interaction.reply({ embeds: [muteEmbed] });
            
            await user.send(`You have been muted in ${interaction.guild.name} for ${time} minutes. Reason: ${reason}`)
                .catch(() => console.log("Couldn't send DM to user"));

            // Set timeout to unmute the user
            setTimeout(async () => {
                if (user.communicationDisabledUntilTimestamp > Date.now()) {
                    try {
                        await user.timeout(null);
                        const unmuteEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('🔊 User Unmuted')
                            .setDescription(`${user.user.tag} has been automatically unmuted.`)
                            .setTimestamp()
                            .setFooter({ text: 'Florida State Roleplay - Moderation' });
                        
                        await interaction.channel.send({ embeds: [unmuteEmbed] });
                    } catch (error) {
                        console.error('Error unmuting user:', error);
                    }
                }
            }, muteTime);

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error muting this user!', 
                ephemeral: true 
            });
        }
    },
};
