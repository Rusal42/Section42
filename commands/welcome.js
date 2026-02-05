const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'welcome',
    description: 'Manually welcome a new member (Moderator+ only)',
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manually welcome a new member (Moderator+ only)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to welcome')
                .setRequired(true)),
    
    async execute(message, args) {
        // Check if user has moderator permissions
        if (!message.member.permissions.has('ManageMessages') && 
            !message.member.permissions.has('KickMembers') && 
            !message.member.permissions.has('BanMembers')) {
            return message.reply('This command is only available to moderators and above!');
        }
        
        let targetUser = null;
        
        if (args.length >= 1) {
            // Try to get user from mention or ID
            const userId = args[0].replace(/[<@!>]/g, '');
            targetUser = message.mentions.users.first() || 
                        message.guild.members.cache.get(userId)?.user ||
                        message.client.users.cache.get(userId);
        }
        
        if (!targetUser) {
            return message.reply('Please specify a valid user to welcome!');
        }
        
        await this.sendWelcome(message.client, targetUser, message.channel, message.guild);
    },
    
    async executeSlash(interaction) {
        // Check if user has moderator permissions
        if (!interaction.member.permissions.has('ManageMessages') && 
            !interaction.member.permissions.has('KickMembers') && 
            !interaction.member.permissions.has('BanMembers')) {
            return await interaction.reply({
                content: 'This command is only available to moderators and above!',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('user');
        await interaction.deferReply();
        await this.sendWelcome(interaction.client, targetUser, interaction.channel, interaction.guild);
        await interaction.deleteReply();
    },
    
    async sendWelcome(client, targetUser, channel, guild) {
        try {
            // Create welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🌟 Welcome to Section42!')
                .setDescription(`Hey ${targetUser.toString()}! Welcome to crucifyym's community! 🎉\n\nWe're excited to have you here! Feel free to introduce yourself and check out our channels.`)
                .setColor('#ff6b35')
                .addFields(
                    {
                        name: '🚀 Getting Started',
                        value: '• Introduce yourself in general-chat\n• Check out #rules and #server-info\n• Grab some color roles with !colors\n• Join our voice channels to hang out',
                        inline: false
                    },
                    {
                        name: '🎮 What We Do',
                        value: '• Game development discussions\n• Content creator support\n• Community events & giveaways\n• Fun bots and activities',
                        inline: false
                    },
                    {
                        name: '💬 Quick Tips',
                        value: '• Use !help to see available commands\n• Be respectful and follow the rules\n• Have fun and make some friends!',
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setImage('https://media.discordapp.net/attachments/1421592736221626572/1421592800008552498/section42-banner.png')
                .setFooter({ 
                    text: `Member #${guild.memberCount} • Joined ${new Date().toLocaleDateString()}`, 
                    iconURL: guild.iconURL() 
                })
                .setTimestamp();

            // Send welcome message
            await channel.send({ embeds: [welcomeEmbed] });
            
            // Send a simple hi message a few seconds later
            setTimeout(async () => {
                try {
                    await channel.send(`👋 Everyone say hi to ${targetUser.toString()}! Welcome to the community! 😊`);
                } catch (error) {
                    console.error('Error sending follow-up hi message:', error);
                }
            }, 3000); // 3 seconds later
            
        } catch (error) {
            console.error('Error sending manual welcome:', error);
            await channel.send('❌ Failed to send welcome message. Please check the console for details.');
        }
    }
};
