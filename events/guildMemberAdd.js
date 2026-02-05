const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        console.log(`👋 New member joined: ${member.user.tag}`);
        
        try {
            // Find the welcome channel
            const welcomeChannel = member.guild.channels.cache.find(channel => 
                channel.name === 'welcome' || 
                channel.name === 'general-chat' ||
                channel.name === 'general'
            );
            
            if (!welcomeChannel) {
                console.log('No welcome/general channel found for new member greeting');
                return;
            }
            
            // Initialize welcome tracking if not exists
            if (!member.client.welcomeTracker) {
                member.client.welcomeTracker = {
                    recentWelcomes: new Map(),
                    greetingResponses: new Map()
                };
            }
            
            // Create welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🌟 Welcome to Section42!')
                .setDescription(`Hey ${member.user.toString()}! Welcome to crucifyym's community! 🎉\n\nWe're excited to have you here! Feel free to introduce yourself and check out our channels.`)
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
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setImage('https://media.discordapp.net/attachments/1421592736221626572/1421592800008552498/section42-banner.png')
                .setFooter({ 
                    text: `Member #${member.guild.memberCount} • Joined ${new Date().toLocaleDateString()}`, 
                    iconURL: member.guild.iconURL() 
                })
                .setTimestamp();

            // Send welcome message
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
            
            // Track this welcome for greeting detection
            member.client.welcomeTracker.recentWelcomes.set(member.id, Date.now());
            
            // Send a simple hi message a few seconds later
            setTimeout(async () => {
                try {
                    await welcomeChannel.send(`👋 Everyone say hi to ${member.user.toString()}! Welcome to the community! 😊`);
                } catch (error) {
                    console.error('Error sending follow-up hi message:', error);
                }
            }, 3000); // 3 seconds later
            
            // Try to give a default role if it exists
            try {
                const defaultRole = member.guild.roles.cache.find(role => 
                    role.name === 'Member' || 
                    role.name === 'Community' ||
                    role.name === '👤 Member'
                );
                
                if (defaultRole) {
                    await member.roles.add(defaultRole);
                    console.log(`✅ Gave ${member.user.tag} the ${defaultRole.name} role`);
                }
            } catch (error) {
                console.log('No default role found or could not assign role:', error.message);
            }
            
        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    }
};
