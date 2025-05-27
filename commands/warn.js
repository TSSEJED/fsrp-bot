const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        try {
            await interaction.reply({ 
                content: `⚠️ ${user.tag} has been warned. Reason: ${reason}`,
                ephemeral: true 
            });
            
            // Send DM to the warned user
            await user.send(`You have been warned in ${interaction.guild.name}. Reason: ${reason}`)
                .catch(() => console.log("Couldn't DM user."));
                
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error warning this user!', 
                ephemeral: true 
            });
        }
    },
};
