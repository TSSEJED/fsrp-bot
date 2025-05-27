const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('try')
        .setDescription('Attempt an action with a random outcome')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('The action to attempt')
                .setRequired(true)),
    async execute(interaction) {
        const action = interaction.options.getString('action');
        const outcomes = [
            { text: 'succeeds with flying colors!', color: 0x00ff00 },
            { text: 'succeeds!', color: 0x55ff55 },
            { text: 'partially succeeds.', color: 0x55ff55 },
            { text: 'barely manages to do it.', color: 0x55ff55 },
            { text: 'fails, but just barely.', color: 0xff5555 },
            { text: 'fails.', color: 0xff5555 },
            { text: 'fails miserably!', color: 0xff0000 },
            { text: 'critically fails!', color: 0x880000 }
        ];
        
        // Randomly select an outcome
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        // Create an embed for the action
        const embed = new EmbedBuilder()
            .setColor(outcome.color)
            .setDescription(`**${interaction.member.displayName}** tries to ${action}...`)
            .addFields(
                { name: 'Outcome', value: `*${outcome.text}*` }
            )
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
