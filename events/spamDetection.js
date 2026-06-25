const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { QUARANTINE_CONFIG } = require('../config/constants');
const { getDataPath } = require('../utils/dataPath');

const SPAM_DATA_FILE = getDataPath('spamDetection.json');

// Ensure data directory exists
const dataDir = getDataPath();
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
const SPAM_THRESHOLD = 5; // Messages within TIME_WINDOW to trigger velocity check
const TIME_WINDOW = 1000; // 1 second — so 5 msgs/sec triggers
const CROSS_CHANNEL_THRESHOLD = 2; // Similar messages across this many channels
const CROSS_CHANNEL_WINDOW = 30000; // 30 seconds for cross-channel detection
const SIMILARITY_THRESHOLD = 0.65; // Minimum content similarity (0.0 - 1.0)
const MAX_MESSAGE_AGE = 10; // Minutes to look back for deletion
const OFFENSE_RESET_WINDOW = 5 * 60 * 1000; // 5 minutes — offenses reset after this

// Escalating timeout durations: 1st, 2nd, 3rd, 4th+
const TIMEOUT_STEPS = [
    30 * 1000,        // 30 seconds
    5 * 60 * 1000,    // 5 minutes
    15 * 60 * 1000,   // 15 minutes
    60 * 60 * 1000    // 1 hour
];

// In-memory recent message log per user for similarity cleanup
const userRecentMessages = new Map();

function normalizeContent(content) {
    if (!content) return '';
    return content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function contentSimilarity(a, b) {
    const normA = normalizeContent(a);
    const normB = normalizeContent(b);
    if (!normA || !normB) return 0;
    if (normA === normB) return 1;

    // For short messages, require exact match or substring
    if (normA.length < 8 || normB.length < 8) {
        return normA.includes(normB) || normB.includes(normA) ? 0.85 : 0;
    }

    const tokensA = new Set(normA.split(' ').filter(t => t.length > 2));
    const tokensB = new Set(normB.split(' ').filter(t => t.length > 2));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);
    return intersection.size / union.size;
}

function isSimilarContent(a, b, threshold = SIMILARITY_THRESHOLD) {
    return contentSimilarity(a, b) >= threshold;
}

function recordMessage(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}:${userId}`;

    if (!userRecentMessages.has(key)) {
        userRecentMessages.set(key, []);
    }

    const log = userRecentMessages.get(key);
    log.push({
        content: message.content,
        timestamp: Date.now(),
        channelId: message.channel.id,
        messageId: message.id
    });

    // Keep only the last 10 minutes
    const cutoff = Date.now() - (MAX_MESSAGE_AGE * 60 * 1000);
    while (log.length > 0 && log[0].timestamp < cutoff) {
        log.shift();
    }
}

// Delete recent messages from a user that are similar to given spam content
async function deleteSimilarMessages(guild, userId, spamContent, options = {}) {
    const minutesBack = options.minutesBack || MAX_MESSAGE_AGE;
    const similarityThreshold = options.similarityThreshold || SIMILARITY_THRESHOLD;
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    let totalDeleted = 0;

    const textChannels = guild.channels.cache.filter(c =>
        c.type === ChannelType.GuildText || c.type === 0
    );

    for (const [, channel] of textChannels) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const similarMessages = messages.filter(m => {
                if (m.author.id !== userId) return false;
                if (m.createdTimestamp < cutoff) return false;
                if (!m.content) return false;
                return isSimilarContent(m.content, spamContent, similarityThreshold);
            });

            if (similarMessages.size > 0) {
                await channel.bulkDelete(similarMessages, true);
                totalDeleted += similarMessages.size;
            }
        } catch (error) {
            // Ignore permission errors
        }
    }

    return totalDeleted;
}

// Purge all recent messages from a user across all text channels
async function purgeUserMessages(guild, userId, minutesBack = 10) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    let totalDeleted = 0;

    const textChannels = guild.channels.cache.filter(c =>
        c.type === ChannelType.GuildText || c.type === 0
    );

    for (const [, channel] of textChannels) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(m =>
                m.author.id === userId && m.createdTimestamp > cutoff
            );

            if (userMessages.size > 0) {
                await channel.bulkDelete(userMessages, true);
                totalDeleted += userMessages.size;
            }
        } catch (error) {
            // Ignore permission errors
        }
    }

    return totalDeleted;
}

function getEscalatedTimeout(spamData, userId) {
    if (!spamData.offenses) spamData.offenses = {};
    const now = Date.now();
    const offense = spamData.offenses[userId];

    if (!offense || (now - offense.lastAt) > OFFENSE_RESET_WINDOW) {
        // First offense or reset
        spamData.offenses[userId] = { count: 1, lastAt: now };
        return TIMEOUT_STEPS[0];
    }

    // Within the reset window — escalate
    offense.count++;
    offense.lastAt = now;
    const step = Math.min(offense.count - 1, TIMEOUT_STEPS.length - 1);
    return TIMEOUT_STEPS[step];
}

async function handleAutoTimeout(message, spamData, spamType, details, spamContent) {
    const userId = message.author.id;

    const timeoutDuration = getEscalatedTimeout(spamData, userId);
    const offenseCount = spamData.offenses[userId].count;
    console.log(`🚨 Spam detected: ${message.author.tag} (${spamType}) — offense #${offenseCount}, timeout: ${timeoutDuration / 1000}s`);

    // Mark user so we stop processing their spam messages
    spamData.quarantinedUsers[userId] = {
        reason: `Auto-mute: ${spamType}`,
        detectedAt: Date.now(),
        details,
        spamType
    };
    saveSpamData(spamData);

    try {
        const member = await message.guild.members.fetch(userId);
        if (!member) return;

        // Timeout the user (Discord native mute) with escalating duration
        try {
            await member.timeout(timeoutDuration, `Auto-timeout: ${spamType} (offense #${offenseCount})`);
            console.log(`Timed out ${message.author.tag} for ${timeoutDuration / 1000}s`);
        } catch (timeoutError) {
            console.error(`Failed to timeout ${message.author.tag}:`, timeoutError);
        }

        // Delete all messages similar to the spam content
        const spamText = spamContent || message.content;
        const similarDeleted = await deleteSimilarMessages(message.guild, userId, spamText, {
            minutesBack: MAX_MESSAGE_AGE,
            similarityThreshold: SIMILARITY_THRESHOLD
        });
        console.log(`Deleted ${similarDeleted} messages similar to spam from ${message.author.tag}`);

        // Also purge any other recent messages from the user as a safety net
        const totalPurged = await purgeUserMessages(message.guild, userId, MAX_MESSAGE_AGE);
        console.log(`Purged ${totalPurged} total recent messages from ${message.author.tag}`);

        // Send alert to staff channel
        const staffChannel = message.guild.channels.cache.find(c =>
            c.name.toLowerCase().includes('staff') && c.type === 0
        );

        if (staffChannel) {
            const alertEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 SPAM AUTO-MUTE ACTIVATED')
                .setDescription(
                    `**User:** ${message.author.tag}\n` +
                    `**User ID:** ${userId}\n` +
                    `**Detection Type:** ${spamType}\n` +
                    `**Details:** ${JSON.stringify(details, null, 2)}\n\n` +
                    `User has been automatically timed out and similar spam messages deleted.`
                )
                .addFields(
                    { name: 'Similar Messages Deleted', value: `${similarDeleted}`, inline: true },
                    { name: 'Total Recent Messages Purged', value: `${totalPurged}`, inline: true },
                    { name: 'Timeout Duration', value: `${timeoutDuration / 1000}s (offense #${offenseCount})`, inline: true },
                    { name: 'Action Required', value: 'Investigate and decide on permanent action', inline: true }
                )
                .setTimestamp();

            await staffChannel.send({ content: '@here', embeds: [alertEmbed] });
        }
    } catch (error) {
        console.error('Error handling spam detection:', error);
    }
}

async function handleAutoQuarantine(message, spamData, spamType, details, spamContent) {
    const userId = message.author.id;

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
            const ticketChannel = message.guild.channels.cache.get(QUARANTINE_CONFIG.TICKET_CHANNEL_ID);
            const supportCategory = message.guild.channels.cache.get(QUARANTINE_CONFIG.SUPPORT_TICKETS_CATEGORY_ID);

            // Deny access to all text channels except the create-ticket channel
            for (const channel of textChannels) {
                if (channel.id === QUARANTINE_CONFIG.TICKET_CHANNEL_ID) continue;
                await channel.permissionOverwrites.edit(quarantineRole, {
                    SendMessages: false,
                    AddReactions: false,
                    CreatePublicPoll: false,
                    SendMessagesInThreads: false,
                    ViewChannel: false
                });
            }

            // Deny access to all voice channels
            for (const channel of voiceChannels) {
                await channel.permissionOverwrites.edit(quarantineRole, {
                    Connect: false,
                    Speak: false,
                    ViewChannel: false
                });
            }

            // Deny access to any future channels created in the support tickets category
            if (supportCategory && supportCategory.type === 4) { // GuildCategory
                await supportCategory.permissionOverwrites.edit(quarantineRole, {
                    ViewChannel: false
                });
            }

            // Allow the quarantined user to ONLY see and use the create-ticket channel
            if (ticketChannel) {
                await ticketChannel.permissionOverwrites.edit(quarantineRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AddReactions: false,
                    CreatePublicPoll: false,
                    SendMessagesInThreads: false
                });
            }

            // Delete all messages similar to the spam content
            const spamText = spamContent || message.content;
            const similarDeleted = await deleteSimilarMessages(message.guild, userId, spamText, {
                minutesBack: MAX_MESSAGE_AGE,
                similarityThreshold: SIMILARITY_THRESHOLD
            });

            // Purge all recent messages from the user across all channels
            const totalPurged = await purgeUserMessages(message.guild, userId, MAX_MESSAGE_AGE);

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
                        `User has been quarantined automatically for suspected compromised account activity. Please investigate.`
                    )
                    .addFields(
                        { name: 'Original Roles', value: 'Kept (not removed)', inline: true },
                        { name: 'Similar Messages Deleted', value: `${similarDeleted}`, inline: true },
                        { name: 'Total Recent Messages Purged', value: `${totalPurged}`, inline: true },
                        { name: 'Action Required', value: 'Investigate and decide on permanent action', inline: true }
                    )
                    .setTimestamp();

                await staffChannel.send({ content: '@here', embeds: [alertEmbed] });
            }
        }
    } catch (error) {
        console.error('Error auto-quarantining user:', error);
    }
}

const messageCreateEvent = {
    name: 'messageCreate',
    async execute(message) {
        try {
            // Ignore bot messages
            if (message.author.bot) return;

            // Ignore DMs
            if (!message.guild) return;

            // Check if user is already flagged
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

            // Record message for similarity-based cleanup
            recordMessage(message);

            // Check for spam patterns
            await this.checkSpamPatterns(message, spamData, userData, guildData, channelData);

            // Clean up old messages
            this.cleanupOldData(spamData, now);

            saveSpamData(spamData);
        } catch (error) {
            console.error('[SpamDetection] Error processing message:', error);
        }
    },

    async checkSpamPatterns(message, spamData, userData, guildData, channelData) {
        const now = Date.now();
        const userId = message.author.id;
        const messageContent = (message.content || '').toLowerCase().trim();

        // Pattern 1: High message velocity (5+ messages in 1 second)
        const recentMessages = channelData.messages.filter(m => now - m.timestamp < TIME_WINDOW);
        if (recentMessages.length >= SPAM_THRESHOLD) {
            console.log(`[SpamDetection] TRIGGER rapid_spam for ${message.author.tag} (${recentMessages.length} msgs/sec)`);
            await handleAutoTimeout(message, spamData, 'rapid_spam', {
                messageCount: recentMessages.length,
                channel: message.channel.name,
                timeWindow: `${TIME_WINDOW}ms`
            }, message.content);
            return;
        }

        // Pattern 4: Same/similar message in multiple DIFFERENT channels
        if (messageContent.length > 5) {
            const affectedChannels = new Set();

            for (const [channelId, chData] of Object.entries(guildData.channels || {})) {
                const similarMessages = chData.messages.filter(m => {
                    if (now - m.timestamp > CROSS_CHANNEL_WINDOW) return false;
                    return isSimilarContent(m.content, message.content, SIMILARITY_THRESHOLD);
                });

                if (similarMessages.length > 0) {
                    affectedChannels.add(channelId);
                }
            }

            if (affectedChannels.size > 0) {
                console.log(`[SpamDetection] ${message.author.tag} cross-channel affected=${affectedChannels.size}, threshold=${CROSS_CHANNEL_THRESHOLD}`);
            }
            if (affectedChannels.size >= CROSS_CHANNEL_THRESHOLD) {
                console.log(`[SpamDetection] TRIGGER cross_channel_spam for ${message.author.tag}`);
                await handleAutoQuarantine(message, spamData, 'cross_channel_spam', {
                    messageCount: affectedChannels.size,
                    channels: affectedChannels.size,
                    message: messageContent.substring(0, 100)
                }, message.content);
                return;
            }
        }

        // Pattern 5: Messages containing common spam/phishing indicators across channels
        const spamIndicators = [
            'discord.gift', 'discordnitro', 'free nitro', 'steam community',
            '@everyone', 'click here', 'airdrop', 'claim your', 'free robux',
            'earn money', 'gift card', 'nitro giveaway', 'free money'
        ];
        const hasSpamContent = spamIndicators.some(indicator => messageContent.includes(indicator));
        if (hasSpamContent) {
            const uniqueChannels = new Set();
            let matchingContent = message.content;

            for (const [channelId, chData] of Object.entries(guildData.channels || {})) {
                const spamMessages = chData.messages.filter(m => {
                    if (now - m.timestamp > CROSS_CHANNEL_WINDOW) return false;
                    return spamIndicators.some(ind => m.content.toLowerCase().includes(ind));
                });
                if (spamMessages.length > 0) {
                    uniqueChannels.add(channelId);
                    matchingContent = spamMessages[0].content;
                }
            }

            if (uniqueChannels.size >= 2) {
                console.log(`[SpamDetection] TRIGGER phishing_spam for ${message.author.tag}`);
                await handleAutoQuarantine(message, spamData, 'phishing_spam', {
                    messageCount: uniqueChannels.size,
                    channels: uniqueChannels.size,
                    message: messageContent.substring(0, 100)
                }, matchingContent);
                return;
            }
        }
    },

    cleanupOldData(spamData, now) {
        const cutoffTime = now - 300000; // 5 minutes

        for (const [userId, userData] of Object.entries(spamData.userMessageCounts)) {
            for (const [guildId, guildData] of Object.entries(userData.guilds)) {
                for (const [channelId, channelData] of Object.entries(guildData.channels)) {
                    channelData.messages = channelData.messages.filter(m => m.timestamp > cutoffTime);

                    if (channelData.messages.length === 0) {
                        delete guildData.channels[channelId];
                    }
                }

                if (Object.keys(guildData.channels).length === 0) {
                    delete userData.guilds[guildId];
                }
            }

            if (Object.keys(userData.guilds).length === 0 && !spamData.quarantinedUsers[userId]) {
                delete spamData.userMessageCounts[userId];
            }
        }
    }
};

// Cleanup old in-memory records periodically
setInterval(() => {
    const cutoff = Date.now() - (MAX_MESSAGE_AGE * 60 * 1000);
    for (const [key, log] of userRecentMessages.entries()) {
        while (log.length > 0 && log[0].timestamp < cutoff) {
            log.shift();
        }
        if (log.length === 0) {
            userRecentMessages.delete(key);
        }
    }
}, 60000);

const events = [messageCreateEvent];
events.purgeUserMessages = purgeUserMessages;
events.deleteSimilarMessages = deleteSimilarMessages;
module.exports = events;

