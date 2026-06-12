const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'fall',
    description: 'Stop the arrise ping sequence (Owner only)',
    data: new SlashCommandBuilder()
        .setName('fall')
        .setDescription('Stop the arrise ping sequence (Owner only)'),
    ownerOnly: true,
    
    async execute(message, args) {
        const { OWNER_IDS } = require('../config/constants');
        
        if (!OWNER_IDS.includes(message.author.id)) {
            return message.reply('This command is only available to the bot owner!');
        }
        
        try {
            if (!message.client.arriseState || !message.client.arriseState.active) {
                return message.reply('No arrise sequence is currently running.');
            }
            
            const state = message.client.arriseState;
            
            // Stop the interval
            if (state.interval) {
                clearInterval(state.interval);
                state.interval = null;
            }
            
            // Get stats
            const totalPinged = state.pingedUsers.size;
            
            // Reset state
            state.active = false;
            state.pingedUsers.clear();
            state.guildId = null;
            state.channelId = null;
            
            await message.reply(`🌇 Arrise sequence stopped! ${totalPinged} members were pinged before falling.`);
            
        } catch (error) {
            console.error('Error in fall command:', error);
            message.reply('There was an error stopping the arrise sequence!');
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
            if (!interaction.client.arriseState || !interaction.client.arriseState.active) {
                return await interaction.reply({
                    content: 'No arrise sequence is currently running.',
                    ephemeral: true
                });
            }
            
            const state = interaction.client.arriseState;
            
            // Stop the interval
            if (state.interval) {
                clearInterval(state.interval);
                state.interval = null;
            }
            
            // Get stats
            const totalPinged = state.pingedUsers.size;
            
            // Reset state
            state.active = false;
            state.pingedUsers.clear();
            state.guildId = null;
            state.channelId = null;
            
            await interaction.reply(`🌇 Arrise sequence stopped! ${totalPinged} members were pinged before falling.`);
            
        } catch (error) {
            console.error('Error in fall slash command:', error);
            await interaction.reply({
                content: 'There was an error stopping the arrise sequence!',
                ephemeral: true
            });
        }
    }
};
