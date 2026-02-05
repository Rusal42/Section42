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
                .setTitle('Welcome to Section42!')
                .setDescription(`${member.user.toString()} has joined the server! 🎉\n\nMake sure to check out ⁠rules and get your roles!`)
                .setColor('#ff6b35')
                .setImage('https://media.discordapp.net/attachments/1421592736221626572/1421592800008552498/section42-banner.png')
                .setFooter({ 
                    text: `Member #${member.guild.memberCount} • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 
                    iconURL: member.guild.iconURL() 
                })
                .setTimestamp();

            // Send welcome message
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
            
            // Track this welcome for greeting detection
            member.client.welcomeTracker.recentWelcomes.set(member.id, Date.now());
            
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
