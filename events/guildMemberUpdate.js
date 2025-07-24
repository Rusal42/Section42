const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        try {
            // Check if the member started boosting the server
            const wasBooster = oldMember.premiumSince;
            const isBooster = newMember.premiumSince;
            
            // If they weren't boosting before but are now boosting
            if (!wasBooster && isBooster) {
                console.log(`🚀 ${newMember.user.tag} started boosting the server!`);
                
                // Find the VIP role
                const vipRole = newMember.guild.roles.cache.find(role => role.name === '⭐ VIP');
                
                if (!vipRole) {
                    console.error('VIP role not found in server');
                    return;
                }
                
                // Check if they already have the VIP role
                if (newMember.roles.cache.has(vipRole.id)) {
                    console.log(`${newMember.user.tag} already has VIP role`);
                    return;
                }
                
                // Assign the VIP role
                await newMember.roles.add(vipRole, 'Automatic VIP role for server booster');
                console.log(`✅ Assigned VIP role to ${newMember.user.tag} for boosting`);
                
                // Send a thank you message in general chat
                const generalChannel = newMember.guild.channels.cache.find(channel => 
                    channel.name === '💬-general' && channel.type === 0
                );
                
                if (generalChannel) {
                    const boostEmbed = new EmbedBuilder()
                        .setColor('#b6dbd9')
                        .setTitle('🚀 Server Boost!')
                        .setDescription(`Thank you ${newMember.user} for boosting our server! 🎉`)
                        .addFields(
                            {
                                name: '⭐ VIP Benefits Unlocked',
                                value: '• Access to VIP voice lounge\n• Enhanced permissions\n• Special recognition\n• Priority support',
                                inline: false
                            }
                        )
                        .setThumbnail(newMember.user.displayAvatarURL())
                        .setTimestamp()
                        .setFooter({ text: 'Automatic VIP role assigned', iconURL: newMember.guild.iconURL() });
                    
                    await generalChannel.send({ embeds: [boostEmbed] });
                }
            }
            
            // Check if the member stopped boosting the server
            if (wasBooster && !isBooster) {
                console.log(`💔 ${newMember.user.tag} stopped boosting the server`);
                
                // Find the VIP role
                const vipRole = newMember.guild.roles.cache.find(role => role.name === '⭐ VIP');
                
                if (!vipRole) {
                    console.error('VIP role not found in server');
                    return;
                }
                
                // Check if they have the VIP role
                if (newMember.roles.cache.has(vipRole.id)) {
                    // Remove the VIP role
                    await newMember.roles.remove(vipRole, 'Removed VIP role - no longer boosting');
                    console.log(`❌ Removed VIP role from ${newMember.user.tag} - stopped boosting`);
                    
                    // Send a farewell message in general chat
                    const generalChannel = newMember.guild.channels.cache.find(channel => 
                        channel.name === '💬-general' && channel.type === 0
                    );
                    
                    if (generalChannel) {
                        const unboostEmbed = new EmbedBuilder()
                            .setColor('#77bfba')
                            .setTitle('💔 Boost Ended')
                            .setDescription(`${newMember.user} is no longer boosting the server. Thank you for your past support! 💙`)
                            .addFields(
                                {
                                    name: '🎯 Want VIP Back?',
                                    value: 'Boost the server again to regain your VIP benefits!',
                                    inline: false
                                }
                            )
                            .setThumbnail(newMember.user.displayAvatarURL())
                            .setTimestamp()
                            .setFooter({ text: 'VIP role removed', iconURL: newMember.guild.iconURL() });
                        
                        await generalChannel.send({ embeds: [unboostEmbed] });
                    }
                }
            }
            
        } catch (error) {
            console.error('Error handling server boost status change:', error);
        }
    },
};
