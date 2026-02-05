const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'shutup',
    description: 'Toggle bot activity monitoring and conversation starters',
    async execute(message, args) {
        // Check if user is owner
        if (!OWNER_IDS.includes(message.author.id)) {
            await message.reply("fuck off you're not my owner don't tell me what to do");
            return;
        }
        
        // Initialize bot monitoring state if not exists
        if (!message.client.botMonitoring) {
            message.client.botMonitoring = {
                enabled: true,
                conversationStarters: true,
                inactivePings: true
            };
        }
        
        const monitoring = message.client.botMonitoring;
        
        // Toggle all monitoring features
        monitoring.enabled = !monitoring.enabled;
        monitoring.conversationStarters = monitoring.enabled;
        monitoring.inactivePings = monitoring.enabled;
        
        if (monitoring.enabled) {
            await message.reply("Bot monitoring and conversation starters re-enabled. The server will be monitored for activity.");
        } else {
            await message.reply("Bot monitoring and conversation starters disabled. I'll shut up now.");
        }
    },
    
    async executeSlash(interaction) {
        // Check if user is owner
        if (!OWNER_IDS.includes(interaction.user.id)) {
            await interaction.reply({
                content: "fuck off you're not my owner don't tell me what to do",
                ephemeral: true
            });
            return;
        }
        
        // Initialize bot monitoring state if not exists
        if (!interaction.client.botMonitoring) {
            interaction.client.botMonitoring = {
                enabled: true,
                conversationStarters: true,
                inactivePings: true
            };
        }
        
        const monitoring = interaction.client.botMonitoring;
        
        // Toggle all monitoring features
        monitoring.enabled = !monitoring.enabled;
        monitoring.conversationStarters = monitoring.enabled;
        monitoring.inactivePings = monitoring.enabled;
        
        if (monitoring.enabled) {
            await interaction.reply({
                content: "Bot monitoring and conversation starters re-enabled. The server will be monitored for activity.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "Bot monitoring and conversation starters disabled. I'll shut up now.",
                ephemeral: true
            });
        }
    }
};
