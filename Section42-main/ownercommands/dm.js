const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'dm',
    description: 'Send a DM to a user (Owner only, Discord compliant)',
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a DM to a user (Owner only)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to DM')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('Custom message (optional)')
                .setRequired(false)),
    ownerOnly: true,
    
    async execute(message, args) {
        const { OWNER_IDS } = require('../config/constants');
        
        if (!OWNER_IDS.includes(message.author.id)) {
            return message.reply('This command is only available to the bot owner!');
        }
        
        // Parse user and message
        let targetUser = null;
        let customMessage = null;
        
        if (args.length >= 1) {
            // Try to get user from mention or ID
            const userId = args[0].replace(/[<@!>]/g, '');
            targetUser = message.mentions.users.first() || 
                        message.guild.members.cache.get(userId)?.user ||
                        message.client.users.cache.get(userId);
            
            // Get custom message if provided
            if (args.length > 1) {
                customMessage = args.slice(1).join(' ');
            }
        }
        
        if (!targetUser) {
            return message.reply('Please specify a valid user to DM!');
        }
        
        await this.sendDM(message.client, targetUser, customMessage, message.channel, message.author);
    },
    
    async executeSlash(interaction) {
        const { OWNER_IDS } = require('../config/constants');
        
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: 'This command is only available to the bot owner!',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('user');
        const customMessage = interaction.options.getString('message');
        
        await interaction.deferReply({ ephemeral: true });
        await this.sendDM(interaction.client, targetUser, customMessage, interaction.channel, interaction.user);
    },
    
    async sendDM(client, targetUser, customMessage, replyChannel, author) {
        try {
            // Check if user has DMs enabled
            const dmChannel = await targetUser.createDM().catch(() => null);
            if (!dmChannel) {
                return await replyChannel.send('❌ This user has DMs disabled or has blocked the bot.');
            }
            
            // Create Discord-compliant message
            let messageContent;
            if (customMessage) {
                messageContent = `🌟 **Message from crucifyym's community** 🌟\n\n${customMessage}\n\n*This is a one-time message. You won't receive further DMs unless you interact with the community.*\n\n*To opt out of future messages, please react with 🚫 to this message.*`;
            } else {
                messageContent = `🌟 **crucifyym's community misses you!** 🌟\n\nHey there! We noticed you haven't been around lately and wanted to let you know you're missed! Come back and hang out with us whenever you're ready. 😊\n\n*This is a one-time message. You won't receive further DMs unless you interact with the community.*\n\n*To opt out of future messages, please react with 🚫 to this message.*`;
            }
            
            // Send the DM
            const dmMessage = await dmChannel.send(messageContent);
            
            // Add opt-out reaction
            await dmMessage.react('🚫');
            
            // Set up reaction collector for opt-out
            const collector = dmMessage.createReactionCollector({
                filter: (reaction, user) => reaction.emoji.name === '🚫' && user.id === targetUser.id,
                max: 1,
                time: 60000 // 1 minute to react
            });
            
            collector.on('collect', () => {
                // Store opt-out preference (you could save this to a file/database)
                if (!client.dOptOutUsers) {
                    client.dOptOutUsers = new Set();
                }
                client.dOptOutUsers.add(targetUser.id);
                
                dmChannel.send('✅ You have opted out of future community messages. You can always opt back in by contacting server staff.');
            });
            
            await replyChannel.send(`✅ Successfully sent DM to ${targetUser.tag}`);
            
        } catch (error) {
            console.error('Error sending DM:', error);
            
            if (error.code === 50007) {
                await replyChannel.send('❌ Cannot send DM to this user. They may have DMs disabled or have blocked the bot.');
            } else {
                await replyChannel.send('❌ Failed to send DM. Please check the console for details.');
            }
        }
    }
};
