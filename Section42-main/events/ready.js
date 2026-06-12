const { REST, Routes } = require('discord.js');
const { restoreReactionRoles } = require('./reactionRoles');
const inviteTracker = require('../utils/inviteTracker');
const { GUILD_CONFIGS } = require('../config/guildConfigs');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        
        const ALLOWED_GUILD_IDS = Object.keys(GUILD_CONFIGS);
        
        // Cache invites for all guilds
        for (const guildId of ALLOWED_GUILD_IDS) {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await inviteTracker.cacheGuildInvites(guild);
            }
        }
        
        // Handle case where slashCommandsData might not be passed
        const commandsData = client.slashCommandsData || [];
        
        if (commandsData.length > 0) {
            const rest = new REST().setToken(process.env.DISCORD_TOKEN);
            
            try {
                console.log(`Started refreshing ${commandsData.length} application (/) commands.`);
                
                const data = await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commandsData },
                );
                
                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                console.error('Error registering slash commands:', error);
            }
        }

        // Restore reaction roles on startup
        await restoreReactionRoles(client, ALLOWED_GUILD_IDS);
    }
};
