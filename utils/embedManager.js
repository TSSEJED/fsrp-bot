const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const EMBEDS_FILE = path.join(__dirname, '../data/embeds.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(EMBEDS_FILE))) {
    fs.mkdirSync(path.dirname(EMBEDS_FILE), { recursive: true });
}

// Initialize embeds file if it doesn't exist
if (!fs.existsSync(EMBEDS_FILE)) {
    fs.writeFileSync(EMBEDS_FILE, '{}');
}

function loadEmbeds() {
    try {
        const data = fs.readFileSync(EMBEDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading embeds:', error);
        return {};
    }
}

function saveEmbeds(embeds) {
    try {
        fs.writeFileSync(EMBEDS_FILE, JSON.stringify(embeds, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving embeds:', error);
        return false;
    }
}

function getEmbed(embedName) {
    const embeds = loadEmbeds();
    return embeds[embedName.toLowerCase()];
}

function setEmbed(embedName, embedData) {
    const embeds = loadEmbeds();
    embeds[embedName.toLowerCase()] = embedData;
    return saveEmbeds(embeds);
}

function removeEmbed(embedName) {
    const embeds = loadEmbeds();
    delete embeds[embedName.toLowerCase()];
    return saveEmbeds(embeds);
}

function listEmbeds() {
    const embeds = loadEmbeds();
    return Object.keys(embeds);
}

function createEmbedFromData(embedData) {
    const embed = new EmbedBuilder();
    
    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    
    // Handle color - ensure it's a number
    if (embedData.color) {
        const color = typeof embedData.color === 'string' 
            ? parseInt(embedData.color.replace('#', ''), 16) 
            : embedData.color;
        embed.setColor(color);
    }
    
    if (embedData.url) embed.setURL(embedData.url);
    
    // Handle timestamp - convert string to Date if needed
    if (embedData.timestamp) {
        const timestamp = typeof embedData.timestamp === 'string' 
            ? new Date(embedData.timestamp) 
            : embedData.timestamp;
        embed.setTimestamp(timestamp);
    }
    
    if (embedData.author) {
        const author = {
            name: embedData.author.name || '',
            iconURL: embedData.author.iconURL,
            url: embedData.author.url
        };
        if (author.name) embed.setAuthor(author);
    }
    
    if (embedData.thumbnail) {
        embed.setThumbnail(embedData.thumbnail);
    }
    
    if (embedData.image) {
        embed.setImage(embedData.image);
    }
    
    if (embedData.fields && Array.isArray(embedData.fields)) {
        embed.addFields(embedData.fields);
    }
    
    if (embedData.footer) {
        const footer = {
            text: embedData.footer.text || '',
            iconURL: embedData.footer.iconURL
        };
        if (footer.text) embed.setFooter(footer);
    }
    
    return embed;
}

// Export all functions
module.exports = {
    getEmbed,
    setEmbed,
    removeEmbed,
    listEmbeds,
    createEmbedFromData,
    loadEmbeds,
    saveEmbeds
};
