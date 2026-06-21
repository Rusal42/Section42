const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SPAM_DATA_FILE = path.join(__dirname, '..', 'data', 'spamDetection.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(SPAM_DATA_FILE)) {
    fs.writeFileSync(SPAM_DATA_FILE, JSON.stringify({
        userMessageCounts: {},
        recentMessages: {},
        quarantinedUsers: {}
    }, null, 2));
}

function loadSpamData() {
    try {
        const data = fs.readFileSync(SPAM_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {
            userMessageCounts: {},
            recentMessages: {},
            quarantinedUsers: {}
        };
    }
}

function saveSpamData(data) {
    fs.writeFileSync(SPAM_DATA_FILE, JSON.stringify(data, null, 2));
}

// Configuration
const SPAM_THRESHOLD = 7; // Messages in time window to trigger
const TIME_WINDOW = 10000; // 10 seconds in milliseconds
const CLEANUP_INTERVAL = 60000; // Clean up old data every minute
const CROSS_CHANNEL_THRESHOLD = 3; // Identical messages across this many channels
const CROSS_CHANNEL_WINDOW = 30000; // 30 seconds for cross-channel detection

// Purge a user's recent messages from ALL text channels in a guild
async function purgeUserMessages(guild, userId, minutesBack = 10) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    let totalDeleted = 0;

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText || c.type === 0);

    for (const [, channel] of textChannels) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(m => m.author.id === userId && m.createdTimestamp > cutoff);

            if (userMessages.size > 0) {
                await channel.bulkDelete(userMessages, true);
                totalDeleted += userMessages.size;
            }
        } catch (error) {
            // Ignore permission errors for channels the bot can't access
        }
    }

    return totalDeleted;
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Ignore DMs
        if (!message.guild) return;
        
        // Check if user is already quarantined
        const spamData = loadSpamData();
        if (spamData.quarantinedUsers[message.author.id]) return;

        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();

        // Initialize user data if not exists
        if (!spamData.userMessageCounts[userId]) {
            spamData.userMessageCounts[userId] = {
                count: 0,
                firstMessage: now,
                guilds: {}
            };
        }

        if (!spamData.userMessageCounts[userId].guilds[guildId]) {
            spamData.userMessageCounts[userId].guilds[guildId] = {
                count: 0,
                channels: {}
            };
        }

        if (!spamData.userMessageCounts[userId].guilds[guildId].channels[message.channel.id]) {
            spamData.userMessageCounts[userId].guilds[guildId].channels[message.channel.id] = {
                count: 0,
                messages: []
            };
        }

        // Track message
        const userData = spamData.userMessageCounts[userId];
        const guildData = userData.guilds[guildId];
        const channelData = guildData.channels[message.channel.id];

        userData.count++;
        guildData.count++;
        channelData.count++;
        channelData.messages.push({
            content: message.content,
            timestamp: now,
            channelId: message.channel.id
        });

        // Check for spam patterns
        await this.checkSpamPatterns(message, spamData, userData, guildData, channelData);

        // Clean up old messages
        this.cleanupOldData(spamData, now);
        
        saveSpamData(spamData);
    },

    async checkSpamPatterns(message, spamData, userData, guildData, channelData) {
        const now = Date.now();
        const userId = message.author.id;

        // Pattern 1: High message velocity in a single channel
        const recentMessages = channelData.messages.filter(m => now - m.timestamp < TIME_WINDOW);
        
        if (recentMessages.length >= SPAM_THRESHOLD) {
            await this.handlePotentialHack(message, spamData, 'rapid_spam', {
                messageCount: recentMessages.length,
                channel: message.channel.name,
                timeWindow: TIME_WINDOW / 1000
            });
            return;
        }

        // Pattern 2: High message velocity across all channels in the guild
        const allGuildMessages = [];
        for (const [, chData] of Object.entries(guildData.channels || {})) {
            allGuildMessages.push(...chData.messages.filter(m => now - m.timestamp < TIME_WINDOW));
        }
        if (allGuildMessages.length >= SPAM_THRESHOLD) {
            const uniqueChannels = new Set(allGuildMessages.map(m => m.channelId));
            await this.handlePotentialHack(message, spamData, 'high_velocity_spam', {
                messageCount: allGuildMessages.length,
                timeSpan: TIME_WINDOW / 1000,
                channels: uniqueChannels.size
            });
            return;
        }

        // Pattern 3: Same/similar message in multiple DIFFERENT channels (classic hack behavior)
        const messageContent = message.content.toLowerCase().trim();
        if (messageContent.length > 10) {
            const affectedChannels = new Set();

            for (const [channelId, chData] of Object.entries(guildData.channels || {})) {
                const similarMessages = chData.messages.filter(m => {
                    if (now - m.timestamp > CROSS_CHANNEL_WINDOW) return false;
                    const content = m.content.toLowerCase().trim();
                    // Exact match or very similar (shares 80%+ of content)
                    return content === messageContent || 
                           (content.length > 10 && messageContent.includes(content.slice(0, Math.floor(content.length * 0.8))));
                });
                
                if (similarMessages.length > 0) {
                    affectedChannels.add(channelId);
                }
            }

            if (affectedChannels.size >= CROSS_CHANNEL_THRESHOLD) {
                await this.handlePotentialHack(message, spamData, 'cross_channel_spam', {
                    messageCount: affectedChannels.size,
                    channels: affectedChannels.size,
                    message: messageContent.substring(0, 100)
                });
                return;
            }
        }

        // Pattern 4: Messages containing common spam/phishing indicators across channels
        const spamIndicators = ['discord.gift', 'discordnitro', 'free nitro', 'steam community', '@everyone', 'click here', 'airdrop', 'claim your'];
        const hasSpamContent = spamIndicators.some(indicator => messageContent.includes(indicator));
        if (hasSpamContent) {
            const uniqueChannels = new Set();
            for (const [channelId, chData] of Object.entries(guildData.channels || {})) {
                const spamMessages = chData.messages.filter(m => {
                    if (now - m.timestamp > CROSS_CHANNEL_WINDOW) return false;
                    return spamIndicators.some(ind => m.content.toLowerCase().includes(ind));
                });
                if (spamMessages.length > 0) uniqueChannels.add(channelId);
            }

            if (uniqueChannels.size >= 2) {
                await this.handlePotentialHack(message, spamData, 'phishing_spam', {
                    messageCount: uniqueChannels.size,
                    channels: uniqueChannels.size,
                    message: messageContent.substring(0, 100)
                });
                return;
            }
        }
    },

    async handlePotentialHack(message, spamData, spamType, details) {
        const userId = message.author.id;
        const guildId = message.guild.id;

        console.log(`🚨 Potential hacked account detected: ${message.author.tag} (${spamType})`);

        // Mark as quarantined
        spamData.quarantinedUsers[userId] = {
            reason: `Auto-quarantine: ${spamType}`,
            detectedAt: Date.now(),
            details,
            spamType
        };

        saveSpamData(spamData);

        // Quarantine the user
        try {
            const member = await message.guild.members.fetch(userId);
            if (member) {
                // Store original roles
                const originalRoles = member.roles.cache.map(r => r.id).filter(id => id !== guildId);
                
                // Remove all roles except @everyone
                await member.roles.set([], 'Auto-quarantine: Potential hacked account');

                // Create or get quarantine role
                let quarantineRole = message.guild.roles.cache.find(r => r.name === 'Quarantined');
                if (!quarantineRole) {
                    quarantineRole = await message.guild.roles.create({
                        name: 'Quarantined',
                        color: '#8B0000',
                        reason: 'Auto-quarantine role for compromised accounts'
                    });
                }

                // Assign quarantine role
                await member.roles.add(quarantineRole, 'Auto-quarantine: Potential hacked account');

                // Update quarantine role permissions for all channels
                const textChannels = message.guild.channels.cache.filter(c => c.type === 0); // GuildText
                const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2); // GuildVoice

                for (const channel of textChannels) {
                    await channel.permissionOverwrites.edit(quarantineRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicPoll: false,
                        SendMessagesInThreads: false,
                        ViewChannel: false
                    });
                }

                for (const channel of voiceChannels) {
                    await channel.permissionOverwrites.edit(quarantineRole, {
                        Connect: false,
                        Speak: false,
                        ViewChannel: false
                    });
                }

                // Send alert to staff channel
                const staffChannel = message.guild.channels.cache.find(c => 
                    c.name.toLowerCase().includes('staff') && c.type === 0
                );

                if (staffChannel) {
                    const alertEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🚨 AUTO-QUARANTINE ACTIVATED')
                        .setDescription(
                            `**User:** ${message.author.tag}\n` +
                            `**User ID:** ${userId}\n` +
                            `**Detection Type:** ${spamType}\n` +
                            `**Details:** ${JSON.stringify(details, null, 2)}\n\n` +
                            `User has been quarantined automatically. Please investigate.`
                        )
                        .addFields(
                            { name: 'Original Roles', value: `${originalRoles.length} roles removed`, inline: true },
                            { name: 'Action Required', value: 'Investigate and decide on permanent action', inline: true }
                        )
                        .setTimestamp();

                    await staffChannel.send({ content: '@here', embeds: [alertEmbed] });
                }

                // Purge all recent messages from the user across all channels
                const totalDeleted = await purgeUserMessages(message.guild, userId, 10);
                console.log(`Purged ${totalDeleted} messages from ${message.author.tag} across all channels`);

                // Send announcement to announcements channel
                const announcementsChannel = message.guild.channels.cache.find(c => 
                    c.name.toLowerCase().includes('announcements') && c.type === 0
                );

                if (announcementsChannel) {
                    const announceEmbed = new EmbedBuilder()
                        .setColor('#ff6600')
                        .setTitle('🛡️ Security Action Taken')
                        .setDescription(
                            `A compromised account has been automatically quarantined.\n\n` +
                            `**Action:** User restricted and spam removed\n` +
                            `**Status:** Server is secure\n\n` +
                            `Staff are investigating the situation.`
                        )
                        .setTimestamp();

                    await announcementsChannel.send({ embeds: [announceEmbed] });
                }
            }
        } catch (error) {
            console.error('Error quarantining user:', error);
        }
    },

    cleanupOldData(spamData, now) {
        // Clean up old message data (older than 5 minutes)
        const cutoffTime = now - 300000; // 5 minutes

        for (const [userId, userData] of Object.entries(spamData.userMessageCounts)) {
            for (const [guildId, guildData] of Object.entries(userData.guilds)) {
                for (const [channelId, channelData] of Object.entries(guildData.channels)) {
                    channelData.messages = channelData.messages.filter(m => m.timestamp > cutoffTime);
                    
                    // Remove empty channel data
                    if (channelData.messages.length === 0) {
                        delete guildData.channels[channelId];
                    }
                }

                // Remove empty guild data
                if (Object.keys(guildData.channels).length === 0) {
                    delete userData.guilds[guildId];
                }
            }

            // Remove empty user data (but keep if user is quarantined)
            if (Object.keys(userData.guilds).length === 0 && !spamData.quarantinedUsers[userId]) {
                delete spamData.userMessageCounts[userId];
            }
        }
    },

    purgeUserMessages
};
