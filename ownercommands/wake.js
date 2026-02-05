const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'wake',
    description: 'Turn bot monitoring back on',
    async execute(message, args) {
        // Check if user is owner
        if (!OWNER_IDS.includes(message.author.id)) {
            await message.reply("fuck off lil nigga");
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
        
        // Enable all monitoring features
        const monitoring = message.client.botMonitoring;
        monitoring.enabled = true;
        monitoring.conversationStarters = true;
        monitoring.inactivePings = true;
        
        await message.reply("Bot monitoring and conversation starters re-enabled. The server will be monitored for activity.");
    },
    
    async executeSlash(interaction) {
        // Check if user is owner
        if (!OWNER_IDS.includes(interaction.user.id)) {
            await interaction.reply({
                content: "fuck off lil nigga",
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
        
        // Enable all monitoring features
        const monitoring = interaction.client.botMonitoring;
        monitoring.enabled = true;
        monitoring.conversationStarters = true;
        monitoring.inactivePings = true;
        
        await interaction.reply({
            content: "Bot monitoring and conversation starters re-enabled. The server will be monitored for activity.",
            ephemeral: true
        });
    }
};
