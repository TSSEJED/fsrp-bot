require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// Initialize Discord client for worker
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Initialize Express for health checks
const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Worker is healthy');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker running on port ${PORT}`);
    
    // Keep-alive ping
    setInterval(() => {
        console.log('Worker keep-alive ping');
    }, 300000); // Every 5 minutes
});

// Login to Discord
client.login(process.env.TOKEN)
    .then(() => console.log('Worker logged in to Discord'))
    .catch(console.error);

// Error handling
process.on('unhandledRejection', error => {
    console.error('Worker unhandled rejection:', error);
});

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Cleaning up...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    client.destroy();
    process.exit(0);
});
