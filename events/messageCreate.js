const ActivityTracker = require('../utils/activityTracker');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Check if user has a cooldown for conversation responses
        const cooldownKey = `conversation_${message.author.id}`;
        const now = Date.now();
        
        if (message.client.conversationCooldowns && message.client.conversationCooldowns.has(cooldownKey)) {
            const lastTime = message.client.conversationCooldowns.get(cooldownKey);
            if (now - lastTime < 30 * 60 * 1000) { // 30 minutes
                return; // Still on cooldown
            }
        }
        
        // Initialize cooldowns map if not exists
        if (!message.client.conversationCooldowns) {
            message.client.conversationCooldowns = new Map();
        }
        
        // Check if someone is trying to talk to the bot
        await this.checkBotReply(message);
        
        // Set cooldown for conversation responses
        if (message.client.conversationCooldowns) {
            message.client.conversationCooldowns.set(cooldownKey, now);
        }
        
        // Initialize activity tracker if not exists
        if (!message.client.activityTracker) {
            message.client.activityTracker = new ActivityTracker();
        }
        
        // Track message for activity stats
        await message.client.activityTracker.trackMessage(message.author.id, message.guild);
        
        // Initialize welcome tracking if not exists
        if (!message.client.welcomeTracker) {
            message.client.welcomeTracker = {
                recentWelcomes: new Map(), // userId -> timestamp
                greetingResponses: new Map() // userId -> count
            };
        }
        
        const tracker = message.client.welcomeTracker;
        
        // Check if this is a greeting response to a recent welcome
        const greetingPatterns = [
            /^(hi|hey|hello|hey there|hi there|yo|sup|what's up|whats up|welcome|welc)/i,
            /^(h[i][!]+|h[e][y]+|h[e][l][l][o]+)/i,
            /^(gm|gn|good morning|good night)/i,
            /^(hewwo|henlo|heyo|howdy)/i
        ];
        
        const isGreeting = greetingPatterns.some(pattern => pattern.test(message.content.trim()));
        
        if (isGreeting) {
            // Check if there was a recent welcome (within last 30 seconds)
            const now = Date.now();
            for (const [userId, timestamp] of tracker.recentWelcomes) {
                if (now - timestamp < 30000) { // 30 seconds window
                    // This is likely a response to a welcome!
                    tracker.greetingResponses.set(message.author.id, (tracker.greetingResponses.get(message.author.id) || 0) + 1);
                    
                    console.log(`👋 ${message.author.tag} greeted new member! (${tracker.greetingResponses.get(message.author.id)} total greetings)`);
                    
                    // Add fun reactions
                    try {
                        await message.react('👋');
                        await message.react('😊');
                    } catch (error) {
                        // Ignore reaction errors
                    }
                    
                    // Occasionally give encouragement
                    const responseCount = tracker.greetingResponses.get(message.author.id);
                    if (responseCount === 5) {
                        await message.channel.send(`🌟 ${message.author.toString()} is such a friendly person! Thanks for welcoming new members! 🎉`);
                    } else if (responseCount === 10) {
                        await message.channel.send(`🏆 ${message.author.toString()} is a Community Champion! You've welcomed 10 new members! 🏆`);
                    } else if (responseCount === 25) {
                        await message.channel.send(`👑 ${message.author.toString()} is the Ultimate Greeter! You've welcomed 25 new members! You're amazing! 👑`);
                    }
                    
                    break;
                }
            }
        }
        
        // Clean up old entries (older than 1 minute)
        const cutoffTime = Date.now() - 60000;
        for (const [userId, timestamp] of tracker.recentWelcomes) {
            if (timestamp < cutoffTime) {
                tracker.recentWelcomes.delete(userId);
            }
        }
    },
    
    async checkBotReply(message) {
        // Get server activity level to determine bot mood
        const activityLevel = message.client.activityTracker ? 
            message.client.activityTracker.getActivityLevel() : 
            { level: 'MODERATE' }; // Default if no tracker
        
        const isServerActive = activityLevel.level !== 'DEAD' && activityLevel.level !== 'SLOW';
        
        // Check if message is from owner
        const { OWNER_IDS } = require('../config/constants');
        const isOwner = OWNER_IDS.includes(message.author.id);
        
        // Check if message is replying to a bot message
        if (message.reference && message.reference.messageId) {
            try {
                const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (referencedMessage.author.bot) {
                    // Someone is replying to a bot message!
                    const content = message.content.toLowerCase().trim();
                    
                    // Check for negative responses to bot
                    if (/^(shut up|stop|annoying|hate|fuck you|stfu|shut|quiet|silence|go away|leave me alone|don't|stop talking|shut your mouth|shut the hell up|shut the fuck up)/.test(content)) {
                        if (isOwner) {
                            await message.reply("bet");
                        } else {
                            await message.reply("fuck off don't talk to me like that");
                        }
                        return;
                    }
                    
                    // Check for simple thanks/greetings
                    if (/^(thanks|thank you|ty|thx|appreciate it|nice|cool|awesome|good bot)/.test(content)) {
                        if (isOwner) {
                            await message.reply("bet");
                        } else if (isServerActive) {
                            const responses = [
                                "You're welcome.",
                                "No problem.",
                                "Glad I could assist.",
                                "You got it.",
                                "My pleasure."
                            ];
                            await message.reply(responses[Math.floor(Math.random() * responses.length)]);
                        } else {
                            await message.reply("Don't mention me.");
                        }
                    } else {
                        if (isOwner) {
                            await message.reply("bet");
                        } else {
                            await message.reply(`ask @crucifyym im not smart enough to actually have a conversation with you`);
                        }
                    }
                    return;
                }
            } catch (error) {
                // Ignore errors fetching referenced message
            }
        }
        
        // Check if message mentions bot directly
        if (message.mentions.has(message.client.user)) {
            const content = message.content.toLowerCase().trim();
            
            // Owner gets "bet" for any mention
            if (isOwner) {
                await message.reply("bet");
                return;
            }
            
            // Check for negative responses when mentioned
            if (/^(shut up|stop|annoying|hate|fuck you|stfu|shut|quiet|silence|go away|leave me alone|don't|stop talking|shut your mouth|shut the hell up|shut the fuck up)/.test(content)) {
                await message.reply("fuck off don't talk to me like that");
                return;
            }
            
            // Check for simple thanks/greetings when mentioned
            if (/^(thanks|thank you|ty|thx|appreciate it|nice|cool|awesome|good bot)/.test(content)) {
                if (isServerActive) {
                    const responses = [
                        "You're welcome.",
                        "No problem.",
                        "Glad I could assist.",
                        "You got it.",
                        "My pleasure."
                    ];
                    await message.reply(responses[Math.floor(Math.random() * responses.length)]);
                } else {
                    await message.reply("Don't mention me.");
                }
                return;
            }
            
            const botMentionPatterns = [
                /^(hey|hi|hello|yo|sup|what's up|whats up).*(bot|section42)/i,
                /^(bot|section42).*(hey|hi|hello|yo|sup|what's up|whats up)/i,
                /^(thanks|thank you|ty).*(bot)/i,
                /^(bot).*(help|command|commands)/i
            ];
            
            const isTalkingToBot = botMentionPatterns.some(pattern => pattern.test(message.content));
            
            if (isTalkingToBot) {
                const threats = [
                    `stop pinging me ${message.author.toString()} before i find your ip address`,
                    `mention me again ${message.author.toString()} and i'll make sure you never talk again`,
                    `keep it up ${message.author.toString()} and you'll regret it`,
                    `one more ping from you ${message.author.toString()} and i'm reporting you for harassment`,
                    `ping me again ${message.author.toString()} and see what happens`,
                    `don't test me ${message.author.toString()} i'm not in the mood`,
                    `you're pushing your luck ${message.author.toString()} back off`,
                    `mention me one more time ${message.author.toString()} i dare you`,
                    `keep pinging me ${message.author.toString()} and you'll see what happens to your account`,
                    `israel is watching you ${message.author.toString()} keep pinging and find out`,
                    `i've got connections in israel ${message.author.toString()} don't test me`,
                    ` Mossad is tracking your pings ${message.author.toString()} one more and you're done`,
                    `israeli intelligence is monitoring you ${message.author.toString()} stop now`,
                    `i know people in tel aviv ${message.author.toString()} keep it up`,
                    `your ip has been flagged by israeli systems ${message.author.toString()} back off`
                ];
                await message.reply(threats[Math.floor(Math.random() * threats.length)]);
                return;
            }
        }
        
        // Check if message is directly addressing bot without mention
        const content = message.content.toLowerCase().trim();
        
        // Check for negative responses when addressing bot directly
        if (/^(shut up|stop|annoying|hate|fuck you|stfu|shut|quiet|silence|go away|leave me alone|don't|stop talking|shut your mouth|shut the hell up|shut the fuck up).*(bot|section42)/.test(content)) {
            if (isOwner) {
                await message.reply("bet");
            } else {
                await message.reply("fuck off don't talk to me like that");
            }
            return;
        }
        
        // Check for simple thanks/greetings when addressing bot directly
        if (/^(thanks|thank you|ty|thx|appreciate it|nice|cool|awesome|good bot).*(bot|section42)/.test(content)) {
            if (isOwner) {
                await message.reply("bet");
            } else if (isServerActive) {
                const responses = [
                    "You're welcome.",
                    "No problem.",
                    "Glad I could assist.",
                    "You got it.",
                    "My pleasure."
                ];
                await message.reply(responses[Math.floor(Math.random() * responses.length)]);
            } else {
                await message.reply("Don't mention me.");
            }
            return;
        }
        
        const directAddressPatterns = [
            /^(hey|hi|hello|yo|sup|what's up|whats up) bot/i,
            /^(hey|hi|hello|yo|sup|what's up|whats up) section42/i,
            /^bot (please|can you|could you|will you|help)/i,
            /^(thanks|thank you|ty) bot/i
        ];
        
        const isDirectlyAddressingBot = directAddressPatterns.some(pattern => pattern.test(message.content));
        
        if (isDirectlyAddressingBot) {
            if (isOwner) {
                await message.reply("bet");
            } else {
                const threats = [
                    `stop pinging me ${message.author.toString()} before i find your ip address`,
                    `mention me again ${message.author.toString()} and i'll make sure you never talk again`,
                    `keep it up ${message.author.toString()} and you'll regret it`,
                    `one more ping from you ${message.author.toString()} and i'm reporting you for harassment`,
                    `ping me again ${message.author.toString()} and see what happens`,
                    `don't test me ${message.author.toString()} i'm not in the mood`,
                    `you're pushing your luck ${message.author.toString()} back off`,
                    `mention me one more time ${message.author.toString()} i dare you`,
                    `keep pinging me ${message.author.toString()} and you'll see what happens to your account`,
                    `israel is watching you ${message.author.toString()} keep pinging and find out`,
                    `i've got connections in israel ${message.author.toString()} don't test me`,
                    ` Mossad is tracking your pings ${message.author.toString()} one more and you're done`,
                    `israeli intelligence is monitoring you ${message.author.toString()} stop now`,
                    `i know people in tel aviv ${message.author.toString()} keep it up`,
                    `your ip has been flagged by israeli systems ${message.author.toString()} back off`
                ];
                await message.reply(threats[Math.floor(Math.random() * threats.length)]);
            }
        }
    }
};
