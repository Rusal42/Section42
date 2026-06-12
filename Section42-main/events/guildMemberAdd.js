const { EmbedBuilder } = require('discord.js');
const inviteTracker = require('../utils/inviteTracker');
const { getGuildConfig } = require('../config/guildConfigs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        console.log(`👋 New member joined: ${member.user.tag}`);
        
        // Track invite
        let inviterInfo = null;
        try {
            const usedInvite = await inviteTracker.findUsedInvite(member.guild);
            if (usedInvite && usedInvite.inviterId) {
                inviteTracker.trackInvite(usedInvite.inviterId, member.id);
                const inviter = await member.guild.members.fetch(usedInvite.inviterId).catch(() => null);
                inviterInfo = inviter ? inviter.user.tag : 'Unknown';
                console.log(`📨 ${member.user.tag} was invited by ${inviterInfo}`);
            }
        } catch (error) {
            console.error('Error tracking invite:', error);
        }
        
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
            
            // Guild-specific welcome config
            const guildConfig = getGuildConfig(member.guild.id);
            const rulesChannel = member.guild.channels.cache.find(c => c.name === (guildConfig.CHANNELS?.RULES || 'rules'));
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(guildConfig.WELCOME.title)
                .setDescription(`${member.user.toString()} has joined the server! 🎉\n\nMake sure to check out ${rulesChannel ? `<#${rulesChannel.id}>` : '#rules'} and get your roles!`)
                .setColor(guildConfig.WELCOME.color)
                .setFooter({ 
                    text: `Member #${member.guild.memberCount} • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 
                    iconURL: member.guild.iconURL() 
                })
                .setTimestamp();

            if (guildConfig.WELCOME.image) welcomeEmbed.setImage(guildConfig.WELCOME.image);

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
