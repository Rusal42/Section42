const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '..', 'data', 'channelLocks.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(LOCK_FILE)) {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({}, null, 2));
}

function loadLockData() {
    try {
        const data = fs.readFileSync(LOCK_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveLockData(data) {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'lock',
    description: 'Lock and unlock server channels',
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock and unlock server channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Lock a specific channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to lock (defaults to current)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('category')
                .setDescription('Lock all channels in a category')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category to lock')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Lock all text channels')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to unlock (defaults to current)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlockall')
                .setDescription('Unlock all locked channels')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unlocking')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show locked channels'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'channel') {
                await this.handleLockChannel(interaction);
            } else if (subcommand === 'category') {
                await this.handleLockCategory(interaction);
            } else if (subcommand === 'all') {
                await this.handleLockAll(interaction);
            } else if (subcommand === 'unlock') {
                await this.handleUnlock(interaction);
            } else if (subcommand === 'unlockall') {
                await this.handleUnlockAll(interaction);
            } else if (subcommand === 'status') {
                await this.handleStatus(interaction);
            }
        } catch (error) {
            console.error('Lock command error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    async handleLockChannel(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'Channel locked by staff';

        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        if (!lockData[guildId]) {
            lockData[guildId] = {};
        }

        // Store original permissions
        const everyoneRole = interaction.guild.roles.everyone;
        const originalPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
        
        lockData[guildId][channel.id] = {
            type: 'channel',
            originalPerms: originalPerms ? originalPerms.serialize() : null,
            lockedBy: interaction.user.id,
            lockedAt: Date.now(),
            reason
        };

        saveLockData(lockData);

        // Apply lock
        await channel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicPoll: false,
            SendMessagesInThreads: false
        });

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔒 Channel Locked')
            .setDescription(
                `**Channel:** ${channel.toString()}\n` +
                `**Reason:** ${reason}\n` +
                `**Locked by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleLockCategory(interaction) {
        const category = interaction.options.getChannel('category');
        const reason = interaction.options.getString('reason') || 'Category locked by staff';

        if (category.type !== ChannelType.GuildCategory) {
            return interaction.reply({
                content: 'You must select a category channel!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        if (!lockData[guildId]) {
            lockData[guildId] = {};
        }

        const channelsInCategory = interaction.guild.channels.cache.filter(c => c.parentId === category.id);
        let lockedCount = 0;

        for (const channel of channelsInCategory) {
            if (channel.type === ChannelType.GuildText) {
                // Store original permissions
                const everyoneRole = interaction.guild.roles.everyone;
                const originalPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
                
                lockData[guildId][channel.id] = {
                    type: 'category',
                    categoryId: category.id,
                    originalPerms: originalPerms ? originalPerms.serialize() : null,
                    lockedBy: interaction.user.id,
                    lockedAt: Date.now(),
                    reason
                };

                // Apply lock
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false,
                    CreatePublicPoll: false,
                    SendMessagesInThreads: false
                });

                lockedCount++;
            }
        }

        saveLockData(lockData);

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔒 Category Locked')
            .setDescription(
                `**Category:** ${category.name}\n` +
                `**Channels Locked:** ${lockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Locked by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    },

    async handleLockAll(interaction) {
        const reason = interaction.options.getString('reason') || 'All channels locked by staff';

        await interaction.deferReply();

        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        if (!lockData[guildId]) {
            lockData[guildId] = {};
        }

        const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let lockedCount = 0;

        for (const channel of textChannels) {
            // Store original permissions
            const everyoneRole = interaction.guild.roles.everyone;
            const originalPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
            
            lockData[guildId][channel.id] = {
                type: 'all',
                originalPerms: originalPerms ? originalPerms.serialize() : null,
                lockedBy: interaction.user.id,
                lockedAt: Date.now(),
                reason
            };

            // Apply lock
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
                AddReactions: false,
                CreatePublicPoll: false,
                SendMessagesInThreads: false
            });

            lockedCount++;
        }

        saveLockData(lockData);

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔒 All Channels Locked')
            .setDescription(
                `**Channels Locked:** ${lockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Locked by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    },

    async handleUnlock(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        if (!lockData[guildId] || !lockData[guildId][channel.id]) {
            return interaction.reply({
                content: 'This channel is not locked!',
                ephemeral: true
            });
        }

        // Restore original permissions
        const everyoneRole = interaction.guild.roles.everyone;
        const originalPerms = lockData[guildId][channel.id].originalPerms;

        if (originalPerms) {
            await channel.permissionOverwrites.edit(everyoneRole, originalPerms);
        } else {
            await channel.permissionOverwrites.delete(everyoneRole);
        }

        // Remove from lock data
        delete lockData[guildId][channel.id];
        saveLockData(lockData);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔓 Channel Unlocked')
            .setDescription(
                `**Channel:** ${channel.toString()}\n` +
                `**Unlocked by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleUnlockAll(interaction) {
        const reason = interaction.options.getString('reason') || 'Channels unlocked by staff';

        await interaction.deferReply();

        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        if (!lockData[guildId] || Object.keys(lockData[guildId]).length === 0) {
            return interaction.followUp({
                content: 'No channels are currently locked!',
                ephemeral: true
            });
        }

        let unlockedCount = 0;

        for (const channelId of Object.keys(lockData[guildId])) {
            try {
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) continue;

                const everyoneRole = interaction.guild.roles.everyone;
                const originalPerms = lockData[guildId][channelId].originalPerms;

                if (originalPerms) {
                    await channel.permissionOverwrites.edit(everyoneRole, originalPerms);
                } else {
                    await channel.permissionOverwrites.delete(everyoneRole);
                }

                unlockedCount++;
            } catch (error) {
                console.log(`Could not unlock channel ${channelId}: ${error.message}`);
            }
        }

        // Clear lock data
        delete lockData[guildId];
        saveLockData(lockData);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔓 All Channels Unlocked')
            .setDescription(
                `**Channels Unlocked:** ${unlockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Unlocked by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    },

    async handleStatus(interaction) {
        const lockData = loadLockData();
        const guildId = interaction.guild.id;

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🔒 Channel Lock Status');

        if (!lockData[guildId] || Object.keys(lockData[guildId]).length === 0) {
            embed.setDescription('✅ No channels are currently locked')
                .setColor('#00ff00');
        } else {
            const lockedChannels = Object.keys(lockData[guildId]).length;
            const locks = Object.entries(lockData[guildId]).map(([channelId, data]) => {
                const channel = interaction.guild.channels.cache.get(channelId);
                const channelName = channel ? channel.name : `Unknown (${channelId})`;
                const lockedBy = `<@${data.lockedBy}>`;
                const lockedAt = new Date(data.lockedAt).toLocaleString();
                
                return `**${channelName}** - Locked by ${lockedBy} at ${lockedAt}`;
            }).slice(0, 10); // Limit to 10 to avoid embed overflow

            embed.setDescription(`🔒 ${lockedChannels} channel(s) locked`)
                .addFields({ name: 'Locked Channels', value: locks.join('\n') || 'None' });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
