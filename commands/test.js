const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test if the bot is working')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Optional input to echo back')
                .setRequired(false)),

    async execute(interaction) {
        // Calculate latency
        const sent = await interaction.reply({ 
            content: '🔄 Testing...', 
            fetchReply: true,
            ephemeral: true
        });
        
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        // Get optional input
        const input = interaction.options.getString('input');
        
        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Bot is Online!')
            .addFields(
                { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
                { name: 'Status', value: '🟢 Online and responding', inline: true },
                { name: 'Uptime', value: formatUptime(interaction.client.uptime), inline: true },
                { name: 'Server Count', value: `${interaction.client.guilds.cache.size}`, inline: true },
                { name: 'User Count', value: `${interaction.client.users.cache.size}`, inline: true }
            )
            .setTimestamp();
            
        // Add input field if provided
        if (input) {
            embed.addFields({ name: 'Your Input', value: input });
        }
        
        // Update the original reply with the embed
        await interaction.editReply({ 
            content: '',
            embeds: [embed],
            ephemeral: true
        });
    },
};

// Helper function to format uptime
function formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return [
        days > 0 ? `${days}d` : null,
        hours % 24 > 0 ? `${hours % 24}h` : null,
        minutes % 60 > 0 ? `${minutes % 60}m` : null,
        `${seconds % 60}s`
    ].filter(Boolean).join(' ');
}
