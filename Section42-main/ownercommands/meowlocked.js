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

module.exports = {
    name: 'meowlocked',
    description: 'List all meowlocked users in this server (Owner only)',
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

        const allLocks = loadMeowlocks();
        const locked = allLocks[guildId] || [];
        
        if (locked.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('No Meowlocked Users')
                .setDescription('No users are currently meowlocked in this server!')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const userTags = await Promise.all(
            locked.map(async entry => {
                try {
                    const user = await message.client.users.fetch(entry.id);
                    return `**${user.tag}** (${entry.style})`;
                } catch {
                    return `Unknown User (${entry.id}) (${entry.style})`;
                }
            })
        );

        const embed = new EmbedBuilder()
            .setColor('#b6dbd9')
            .setTitle('Meowlocked Users')
            .setDescription(userTags.join('\n'))
            .setFooter({ text: `${locked.length} user${locked.length > 1 ? 's' : ''} meowlocked`, iconURL: message.guild.iconURL() })
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    },
};
