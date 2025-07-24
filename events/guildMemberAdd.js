const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            console.log(`👋 New member joined: ${member.user.tag}`);
            
            // Find the welcome channel
            const welcomeChannel = member.guild.channels.cache.find(channel => 
                channel.name === '👋-welcome' && channel.type === 0
            );
            
            if (!welcomeChannel) {
                console.error('Welcome channel not found');
                return;
            }
            
            // Find important channels dynamically
            const rulesChannel = member.guild.channels.cache.find(channel => 
                channel.name === '📜-rules' && channel.type === 0
            );
            const rolesChannel = member.guild.channels.cache.find(channel => 
                channel.name.includes('roles') && channel.type === 0
            );
            const generalChannel = member.guild.channels.cache.find(channel => 
                channel.name === '💬-general' && channel.type === 0
            );
            
            // Create a beautiful welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('🎉 Welcome to Section 42!')
                .setDescription(`Hey ${member.user}, welcome to our amazing community! 🚀\n\nWe're excited to have you here!`)
                .addFields(
                    {
                        name: '📜 Getting Started',
                        value: `• **FIRST:** Read and accept the ${rulesChannel ? `<#${rulesChannel.id}>` : 'rules'} to unlock the server\n• After accepting: Visit ${rolesChannel ? `<#${rolesChannel.id}>` : 'the roles channel'} to select your roles\n• Then join the conversation in ${generalChannel ? `<#${generalChannel.id}>` : 'general chat'}`,
                        inline: false
                    },
                    {
                        name: '🎯 What You Can Do Here',
                        value: '• 📷 Share screenshots and videos in our media channels\n• 🎰 Try your luck in the casino section\n• 🔊 Join voice chats with other members\n• 📝 Report bugs and suggest bot improvements\n• 🎮 Play games and have fun with the community',
                        inline: false
                    },
                    {
                        name: '⭐ Pro Tip',
                        value: 'Boost our server to get instant **VIP status** with exclusive perks and access to the VIP lounge! 🚀',
                        inline: false
                    }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ 
                    text: `Member #${member.guild.memberCount} • Powered by Section42 Bot`, 
                    iconURL: member.guild.iconURL() 
                });
            
            // Send the welcome message
            await welcomeChannel.send({ 
                content: `${member.user} 🎉`, // Ping the user
                embeds: [welcomeEmbed] 
            });
            
            // Also assign the Newbie role automatically
            const newbieRole = member.guild.roles.cache.find(role => role.name === '🌱 Newbie');
            
            if (newbieRole) {
                await member.roles.add(newbieRole, 'Automatic role for new member');
                console.log(`✅ Assigned Newbie role to ${member.user.tag}`);
            } else {
                console.error('Newbie role not found');
            }
            
            // Log to console for monitoring
            console.log(`✅ Sent welcome message to ${member.user.tag} in ${welcomeChannel.name}`);
            
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    },
};
