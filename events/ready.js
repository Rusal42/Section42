const { REST, Routes } = require('discord.js');
const { restoreReactionRoles } = require('./reactionRoles');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client, ALLOWED_GUILD_IDS, slashCommandsData) {
        console.log(`Logged in as ${client.user.tag}!`);
        
        // Handle case where slashCommandsData might not be passed
        const commandsData = slashCommandsData || [];
        
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
