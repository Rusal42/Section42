const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { OWNER_IDS } = require('../config/constants');

const meowlockPath = path.join(__dirname, '../data/meowlock.json');

function isOwner(userId) {
    return OWNER_IDS.includes(userId);
}

function loadMeowlocks() {
    if (fs.existsSync(meowlockPath)) {
        try {
            const raw = fs.readFileSync(meowlockPath, 'utf8');
            return JSON.parse(raw || '{}');
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveMeowlocks(allLocks) {
    fs.mkdirSync(path.dirname(meowlockPath), { recursive: true });
    fs.writeFileSync(meowlockPath, JSON.stringify(allLocks, null, 2));
}

module.exports = {
    name: 'meowlockclear',
    description: 'Clear all meowlocks in this server (Owner only)',
    async execute(message, args) {
        if (!isOwner(message.author.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const guildId = message.guild?.id;
        if (!guildId) {
            return message.reply('This command can only be used in a server.');
        }

        let allLocks = loadMeowlocks();
        const count = (allLocks[guildId] || []).length;
        
        if (allLocks[guildId]) {
            delete allLocks[guildId];
            saveMeowlocks(allLocks);
        }

        const embed = new EmbedBuilder()
            .setColor('#b6dbd9')
            .setTitle('Meowlocks Cleared')
            .setDescription(`All meowlocks in this server have been cleared! (${count} user${count !== 1 ? 's' : ''})`)
            .setFooter({ text: `Cleared by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    },
};
