require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, Collection, Events } = require('discord.js');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { loadCommands, deployCommands } = require('./utils/commandHandler');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
};

// Routes
app.get('/', requireAuth, (req, res) => {
    res.render('dashboard', {
        bot: client.user,
        guilds: client.guilds.cache,
        user: req.session.user,
        client: client
    });
});

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/');
    }
    res.render('login', { error: req.query.error });
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.CONTROL_PANEL_PASSWORD) {
        req.session.authenticated = true;
        req.session.user = {
            username: 'Admin',
            avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
        return res.redirect('/');
    }
    res.redirect('/login?error=invalid');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.post('/send-message', requireAuth, async (req, res) => {
    try {
        const { channelId, message } = req.body;
        if (!channelId || !message) {
            return res.status(400).json({ success: false, error: 'Missing channel ID or message' });
        }
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }
        
        await channel.send(message);
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// Keep-alive endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Load commands
loadCommands(client).then(() => {
    console.log('Commands loaded successfully');
}).catch(console.error);

// Discord client events
client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Deploy commands
    try {
        await deployCommands(client.commands, client.user.id);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
    
    // Set bot status
    client.user.setPresence({
        status: process.env.STATUS || 'online',
        activities: [{
            name: process.env.ACTIVITY_NAME || 'over the server',
            type: ActivityType.Watching
        }]
    });
    
    // Start the web server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Control panel running on http://localhost:${PORT}`);
        
        // Keep-alive ping
        setInterval(() => {
            console.log('Keep-alive ping');
        }, 300000); // Every 5 minutes
    });
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error executing this command!', 
            ephemeral: true 
        }).catch(console.error);
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.TOKEN).catch(console.error);
