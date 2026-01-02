const fs = require('fs');
const path = require('path');

const MESSAGE_TRACKER_FILE = path.join(__dirname, '..', 'data', 'trackedMessages.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize tracker file if it doesn't exist
if (!fs.existsSync(MESSAGE_TRACKER_FILE)) {
    fs.writeFileSync(MESSAGE_TRACKER_FILE, JSON.stringify({}, null, 2));
}

/**
 * Save a tracked message
 * @param {string} guildId - Guild ID
 * @param {string} messageType - Type of message (e.g., 'reaction_roles_gender', 'server_info', etc.)
 * @param {string} channelId - Channel ID where message was sent
 * @param {string} messageId - Message ID
 */
function saveMessage(guildId, messageType, channelId, messageId) {
    const data = JSON.parse(fs.readFileSync(MESSAGE_TRACKER_FILE, 'utf8'));
    
    if (!data[guildId]) {
        data[guildId] = {};
    }
    
    data[guildId][messageType] = {
        channelId,
        messageId,
        timestamp: Date.now()
    };
    
    fs.writeFileSync(MESSAGE_TRACKER_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get a tracked message
 * @param {string} guildId - Guild ID
 * @param {string} messageType - Type of message
 * @returns {Object|null} Message data or null if not found
 */
function getMessage(guildId, messageType) {
    const data = JSON.parse(fs.readFileSync(MESSAGE_TRACKER_FILE, 'utf8'));
    
    if (data[guildId] && data[guildId][messageType]) {
        return data[guildId][messageType];
    }
    
    return null;
}

/**
 * Get all tracked messages for a guild
 * @param {string} guildId - Guild ID
 * @returns {Object} All tracked messages for the guild
 */
function getAllMessages(guildId) {
    const data = JSON.parse(fs.readFileSync(MESSAGE_TRACKER_FILE, 'utf8'));
    return data[guildId] || {};
}

/**
 * Delete a tracked message
 * @param {string} guildId - Guild ID
 * @param {string} messageType - Type of message
 */
function deleteMessage(guildId, messageType) {
    const data = JSON.parse(fs.readFileSync(MESSAGE_TRACKER_FILE, 'utf8'));
    
    if (data[guildId] && data[guildId][messageType]) {
        delete data[guildId][messageType];
        fs.writeFileSync(MESSAGE_TRACKER_FILE, JSON.stringify(data, null, 2));
    }
}

/**
 * Check if a message still exists in Discord
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID
 * @param {string} messageType - Type of message
 * @returns {Promise<boolean>} True if message exists, false otherwise
 */
async function messageExists(client, guildId, messageType) {
    const messageData = getMessage(guildId, messageType);
    
    if (!messageData) return false;
    
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(messageData.channelId);
        await channel.messages.fetch(messageData.messageId);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    saveMessage,
    getMessage,
    getAllMessages,
    deleteMessage,
    messageExists
};
