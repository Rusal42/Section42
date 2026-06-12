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
            /^(hi|hey|hello|hey there|yo|sup|what's up|whats up|welcome|welc)/i,
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
    }
};
