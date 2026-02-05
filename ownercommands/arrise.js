const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'arrise',
    description: 'Start pinging random people sequentially (Owner only)',
    data: new SlashCommandBuilder()
        .setName('arrise')
        .setDescription('Start pinging random people sequentially (Owner only)'),
    ownerOnly: true,
    
    async execute(message, args) {
        const { OWNER_IDS } = require('../config/constants');
        
        if (!OWNER_IDS.includes(message.author.id)) {
            return message.reply('This command is only available to the bot owner!');
        }
        
        try {
            // Initialize arrise state if not exists
            if (!message.client.arriseState) {
                message.client.arriseState = {
                    active: false,
                    guildId: null,
                    channelId: null,
                    pingedUsers: new Set(),
                    interval: null
                };
            }
            
            const state = message.client.arriseState;
            
            // Stop existing arrise if running
            if (state.active) {
                if (state.interval) {
                    clearInterval(state.interval);
                }
                state.active = false;
                state.pingedUsers.clear();
                await message.reply('Previous arrise sequence stopped.');
            }
            
            // Get all members in the server
            const members = await message.guild.members.fetch();
            
            // Filter out bots and the message author
            const validMembers = members.filter(member => 
                !member.user.bot && 
                member.id !== message.author.id &&
                !member.user.deleted
            );
            
            if (validMembers.size === 0) {
                return message.reply('There are no other members to ping!');
            }
            
            // Initialize state
            state.active = true;
            state.guildId = message.guild.id;
            state.channelId = message.channel.id;
            state.pingedUsers.clear();
            
            // Convert to array for easier manipulation
            const memberArray = Array.from(validMembers.values());
            
            await message.reply(` Arrise sequence started! Pinging ${memberArray.length} members randomly. Use !fall to stop.`);
            
            // Start the interval
            state.interval = setInterval(async () => {
                try {
                    // Check if we've pinged everyone
                    if (state.pingedUsers.size >= memberArray.length) {
                        if (state.interval) {
                            clearInterval(state.interval);
                        }
                        state.active = false;
                        state.pingedUsers.clear();
                        
                        const channel = message.client.channels.cache.get(state.channelId);
                        if (channel) {
                            await channel.send('✅ Arrise sequence complete! Everyone has been pinged.');
                        }
                        return;
                    }
                    
                    // Get members who haven't been pinged yet
                    const remainingMembers = memberArray.filter(member => !state.pingedUsers.has(member.id));
                    
                    if (remainingMembers.length === 0) {
                        // Safety check
                        if (state.interval) {
                            clearInterval(state.interval);
                        }
                        state.active = false;
                        return;
                    }
                    
                    // Pick a random member from remaining
                    const randomMember = remainingMembers[Math.floor(Math.random() * remainingMembers.length)];
                    
                    // Send ping
                    const channel = message.client.channels.cache.get(state.channelId);
                    if (channel) {
                        const pingMessage = await channel.send(` ${randomMember.user.toString()} has arisen!`);
                        
                        // Add to pinged set
                        state.pingedUsers.add(randomMember.id);
                        
                        // Delete the ping after 2 seconds
                        setTimeout(async () => {
                            try {
                                if (pingMessage.deletable) {
                                    await pingMessage.delete();
                                }
                            } catch (error) {
                                console.error('Error deleting arrise ping:', error);
                            }
                        }, 2000);
                    }
                    
                } catch (error) {
                    console.error('Error in arrise interval:', error);
                    // Don't stop the sequence on individual errors
                }
            }, 3000); // Ping every 3 seconds
            
        } catch (error) {
            console.error('Error in arrise command:', error);
            message.reply('There was an error starting the arrise sequence!');
        }
    },
    
    async executeSlash(interaction) {
        const { OWNER_IDS } = require('../config/constants');
        
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: 'This command is only available to the bot owner!',
                ephemeral: true
            });
        }
        
        try {
            // Initialize arrise state if not exists
            if (!interaction.client.arriseState) {
                interaction.client.arriseState = {
                    active: false,
                    guildId: null,
                    channelId: null,
                    pingedUsers: new Set(),
                    interval: null
                };
            }
            
            const state = interaction.client.arriseState;
            
            // Stop existing arrise if running
            if (state.active) {
                if (state.interval) {
                    clearInterval(state.interval);
                }
                state.active = false;
                state.pingedUsers.clear();
                return await interaction.reply('Previous arrise sequence stopped.');
            }
            
            // Get all members in the server
            const members = await interaction.guild.members.fetch();
            
            // Filter out bots and the interaction author
            const validMembers = members.filter(member => 
                !member.user.bot && 
                member.id !== interaction.user.id &&
                !member.user.deleted
            );
            
            if (validMembers.size === 0) {
                return await interaction.reply({
                    content: 'There are no other members to ping!',
                    ephemeral: true
                });
            }
            
            // Initialize state
            state.active = true;
            state.guildId = interaction.guild.id;
            state.channelId = interaction.channel.id;
            state.pingedUsers.clear();
            
            // Convert to array for easier manipulation
            const memberArray = Array.from(validMembers.values());
            
            await interaction.reply(` Arrise sequence started! Pinging ${memberArray.length} members randomly. Use /fall to stop.`);
            
            // Start the interval
            state.interval = setInterval(async () => {
                try {
                    // Check if we've pinged everyone
                    if (state.pingedUsers.size >= memberArray.length) {
                        if (state.interval) {
                            clearInterval(state.interval);
                        }
                        state.active = false;
                        state.pingedUsers.clear();
                        
                        const channel = interaction.client.channels.cache.get(state.channelId);
                        if (channel) {
                            await channel.send(' Arrise sequence complete! Everyone has been pinged.');
                        }
                        return;
                    }
                    
                    // Get members who haven't been pinged yet
                    const remainingMembers = memberArray.filter(member => !state.pingedUsers.has(member.id));
                    
                    if (remainingMembers.length === 0) {
                        // Safety check
                        if (state.interval) {
                            clearInterval(state.interval);
                        }
                        state.active = false;
                        return;
                    }
                    
                    // Pick a random member from remaining
                    const randomMember = remainingMembers[Math.floor(Math.random() * remainingMembers.length)];
                    
                    // Send ping
                    const channel = interaction.client.channels.cache.get(state.channelId);
                    if (channel) {
                        const pingMessage = await channel.send(` ${randomMember.user.toString()} has arisen!`);
                        
                        // Add to pinged set
                        state.pingedUsers.add(randomMember.id);
                        
                        // Delete the ping after 2 seconds
                        setTimeout(async () => {
                            try {
                                if (pingMessage.deletable) {
                                    await pingMessage.delete();
                                }
                            } catch (error) {
                                console.error('Error deleting arrise ping:', error);
                            }
                        }, 2000);
                    }
                    
                } catch (error) {
                    console.error('Error in arrise interval:', error);
                    // Don't stop the sequence on individual errors
                }
            }, 3000); // Ping every 3 seconds
            
        } catch (error) {
            console.error('Error in arrise slash command:', error);
            await interaction.reply({
                content: 'There was an error starting the arrise sequence!',
                ephemeral: true
            });
        }
    }
};
