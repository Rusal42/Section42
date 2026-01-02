const { EmbedBuilder } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');
const messageTracker = require('../utils/messageTracker');

module.exports = {
    name: 'checkmessages',
    description: 'Checks for missing tracked messages and offers to repost them',
    
    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const checkingEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🔍 Checking Tracked Messages')
            .setDescription('Verifying all tracked messages still exist...')
            .setTimestamp();
        
        const checkMessage = await message.channel.send({ embeds: [checkingEmbed] });

        const trackedMessages = messageTracker.getAllMessages(message.guild.id);
        const messageTypes = Object.keys(trackedMessages);

        if (messageTypes.length === 0) {
            const noMessagesEmbed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('📭 No Tracked Messages')
                .setDescription('No messages are currently being tracked for this server.')
                .setTimestamp();
            return checkMessage.edit({ embeds: [noMessagesEmbed] });
        }

        const results = {
            existing: [],
            missing: []
        };

        for (const messageType of messageTypes) {
            const exists = await messageTracker.messageExists(message.client, message.guild.id, messageType);
            
            if (exists) {
                results.existing.push(messageType);
            } else {
                results.missing.push(messageType);
            }
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(results.missing.length > 0 ? '#e67e22' : '#27ae60')
            .setTitle('📊 Message Check Results')
            .setTimestamp();

        const fields = [];

        if (results.existing.length > 0) {
            fields.push({
                name: '✅ Existing Messages',
                value: results.existing.map(type => `• ${type}`).join('\n'),
                inline: false
            });
        }

        if (results.missing.length > 0) {
            fields.push({
                name: '❌ Missing Messages',
                value: results.missing.map(type => `• ${type}`).join('\n'),
                inline: false
            });
            fields.push({
                name: '🔧 How to Fix',
                value: 'Run the appropriate command to repost missing messages:\n' +
                       '• `!sendreactionroles` - For reaction role messages\n' +
                       '• `!sendserverinfo` - For server info messages\n' +
                       '• `!sendroleinfo` - For role info messages',
                inline: false
            });
        } else {
            resultEmbed.setDescription('All tracked messages are present and accounted for! ✨');
        }

        if (fields.length > 0) {
            resultEmbed.addFields(fields);
        }

        await checkMessage.edit({ embeds: [resultEmbed] });
    }
};
