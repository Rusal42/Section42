const { REST, Routes, ActivityType } = require('discord.js');
const { restoreReactionRoles } = require('./reactionRoles');
const { scheduleAutoCloses } = require('../commands/tournament');
const inviteTracker = require('../utils/inviteTracker');
const { getCounter } = require('../utils/memberCounterStore');
const { STATUSES, ROTATION_INTERVAL } = require('../config/botStatus');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        
        // Rotate status through configured statuses
        if (STATUSES.length > 0) {
            const activityTypeMap = {
                Playing: ActivityType.Playing,
                Streaming: ActivityType.Streaming,
                Listening: ActivityType.Listening,
                Watching: ActivityType.Watching,
                Competing: ActivityType.Competing
            };

            let statusIndex = 0;
            const rotateStatus = () => {
                const status = STATUSES[statusIndex];
                client.user.setPresence({
                    activities: [{
                        name: status.text,
                        type: activityTypeMap[status.type] || ActivityType.Listening
                    }]
                });
                statusIndex = (statusIndex + 1) % STATUSES.length;
            };
            rotateStatus();
            setInterval(rotateStatus, ROTATION_INTERVAL * 1000);
        }
        
        // Get ALLOWED_GUILD_IDS from client or use default
        const ALLOWED_GUILD_IDS = ['1421592736221626572', '1392710210862321694'];
        
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
                
                // Clear global commands to prevent duplicates
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: [] },
                );
                console.log('Cleared global commands');
                
                // Register commands for each guild specifically (instant update)
                for (const guildId of ALLOWED_GUILD_IDS) {
                    const guild = client.guilds.cache.get(guildId);
                    if (guild) {
                        await rest.put(
                            Routes.applicationGuildCommands(client.user.id, guildId),
                            { body: commandsData },
                        );
                        console.log(`Reloaded commands for guild: ${guild.name}`);
                    }
                }
                
                console.log(`Successfully reloaded ${commandsData.length} application (/) commands.`);
            } catch (error) {
                console.error('Error registering slash commands:', error);
            }
        }

        // Restore reaction roles on startup
        await restoreReactionRoles(client, ALLOWED_GUILD_IDS);

        // Restore tournament auto-close timers
        scheduleAutoCloses(client);

        // Update member counters on startup (in case members joined/left while offline)
        for (const guildId of ALLOWED_GUILD_IDS) {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                const entry = getCounter(guildId);
                if (entry) {
                    try {
                        const channel = await guild.channels.fetch(entry.channelId).catch(() => null);
                        if (channel) {
                            await guild.members.fetch();
                            const newName = entry.format.replace('{count}', guild.memberCount);
                            if (channel.name !== newName) {
                                await channel.setName(newName);
                                console.log(`[MemberCounter] Updated counter for ${guild.name}: ${newName}`);
                            }
                        }
                    } catch (error) {
                        console.error(`[MemberCounter] Failed to update on startup for ${guildId}:`, error);
                    }
                }
            }
        }
    }
};
