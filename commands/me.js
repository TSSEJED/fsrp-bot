const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Describe an action in third person')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('The action to describe')
                .setRequired(true)),
    async execute(interaction) {
        const action = interaction.options.getString('action');
        
        // Create an embed for the action
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setDescription(`*${interaction.member.displayName} ${action}*`)
            .setFooter({ text: 'Florida State Roleplay' });

        // Delete the original command message if possible
        if (interaction.channel.permissionsFor(interaction.guild.members.me).has('ManageMessages')) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.deleteReply();
            return interaction.channel.send({ embeds: [embed] });
        } else {
            // If we can't delete messages, just reply normally
            return interaction.reply({ embeds: [embed] });
        }
    },
};
