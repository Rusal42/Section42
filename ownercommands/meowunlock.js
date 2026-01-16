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
    name: 'meowunlock',
    description: 'Remove meowlock from a user (Owner only)',
    async execute(message, args) {
        if (!isOwner(message.author.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Meowunlock Command Usage')
                .setDescription('**Usage:** `!meowunlock <@user|userID>`\n\n**Example:**\n`!meowunlock @user`')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const userArg = args[0];
        let user = message.mentions.users.first();
        
        if (!user && userArg) {
            try {
                user = await message.client.users.fetch(userArg.replace(/[<@!>]/g, ''));
            } catch (e) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('User Not Found')
                    .setDescription('Could not find that user by ID.')
                    .setTimestamp();
                return message.channel.send({ embeds: [embed] });
            }
        }

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Invalid User')
                .setDescription('Please mention a user or provide a valid user ID.')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const guildId = message.guild?.id;
        if (!guildId) {
            return message.reply('This command can only be used in a server.');
        }

        let allLocks = loadMeowlocks();
        const before = (allLocks[guildId] || []).length;
        
        if (allLocks[guildId]) {
            allLocks[guildId] = allLocks[guildId].filter(entry => entry.id !== user.id);
        }
        
        saveMeowlocks(allLocks);
        
        if ((allLocks[guildId] || []).length < before) {
            const embed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('User Unlocked')
                .setDescription(`✅ ${user.tag} is no longer meowlocked!`)
                .setFooter({ text: `Unlocked by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Not Meowlocked')
                .setDescription(`${user.tag} was not meowlocked.`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    },
};
