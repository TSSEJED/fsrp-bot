const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll dice with standard notation (e.g., 2d6+3)')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('Dice to roll (e.g., 2d6+3)')
                .setRequired(true)),
    async execute(interaction) {
        const diceInput = interaction.options.getString('dice').toLowerCase();
        const match = diceInput.match(/^(\d*)d(\d+)([+-]?\d*)$/);
        
        if (!match) {
            return interaction.reply({ 
                content: '❌ Invalid dice format! Please use the format `XdY+Z` (e.g., 2d6+3)', 
                ephemeral: true 
            });
        }

        const [, numDiceStr, numSidesStr, modifierStr] = match;
        const numDice = parseInt(numDiceStr) || 1;
        const numSides = parseInt(numSidesStr);
        const modifier = modifierStr ? parseInt(modifierStr) : 0;

        if (numDice < 1 || numDice > 100) {
            return interaction.reply({ 
                content: '❌ Number of dice must be between 1 and 100!', 
                ephemeral: true 
            });
        }

        if (numSides < 2 || numSides > 1000) {
            return interaction.reply({ 
                content: '❌ Number of sides must be between 2 and 1000!', 
                ephemeral: true 
            });
        }

        // Roll the dice
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        // Apply modifier
        const totalWithModifier = total + modifier;
        
        // Format the result
        let resultText = `🎲 **${totalWithModifier}**`;
        if (numDice > 1) {
            resultText += ` (${rolls.join(' + ')}`;
            if (modifier > 0) {
                resultText += ` + ${modifier}`;
            } else if (modifier < 0) {
                resultText += ` - ${Math.abs(modifier)}`;
            }
            resultText += ')';
        } else if (modifier !== 0) {
            resultText += ` (${rolls[0]} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)})`;
        }
        
        // Create an embed for the roll
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`🎲 ${interaction.member.displayName} rolled ${diceInput}`)
            .setDescription(resultText)
            .setFooter({ text: 'Florida State Roleplay - Dice Roller' })
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};
