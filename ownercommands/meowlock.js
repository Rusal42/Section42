const { EmbedBuilder, PermissionsBitField } = require('discord.js');
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
    name: 'meowlock',
    description: 'Lock a user to only say meow or nya (Owner only)',
    async execute(message, args) {
        if (!isOwner(message.author.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (args.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Meowlock Command Usage')
                .setDescription('**Usage:** `!meowlock <@user|userID> <meow|nya>`\n\n**Examples:**\n`!meowlock @user meow`\n`!meowlock 123456789012345678 nya`')
                .addFields(
                    { name: 'Styles', value: '`meow` - Forces user to say "meow"\n`nya` - Forces user to say "nya"', inline: false }
                )
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const userArg = args[0];
        const style = args[1].toLowerCase();

        if (!['nya', 'meow'].includes(style)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Invalid Style')
                .setDescription('Please specify a style: `meow` or `nya`')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

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
        
        if (!allLocks[guildId]) allLocks[guildId] = [];
        let locked = allLocks[guildId];
        
        locked = locked.filter(entry => entry.id !== user.id);
        locked.push({ id: user.id, style });
        allLocks[guildId] = locked;
        
        try {
            saveMeowlocks(allLocks);
            const embed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('User Meowlocked')
                .setDescription(`✅ ${user.tag} is now meowlocked with style: **${style}**!`)
                .setFooter({ text: `Locked by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('[meowlock] Write failed:', err);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('Failed to save meowlock data: ' + err.message)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    },
};
