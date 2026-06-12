const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('🔄 Starting activity monitoring system...');
        
        // Initialize activity tracker if not exists
        if (!client.activityTracker) {
            const ActivityTracker = require('../utils/activityTracker');
            client.activityTracker = new ActivityTracker();
        }
        
        // Check activity every 5 minutes - DISABLED
        // setInterval(async () => {
        //     await this.checkActivity(client);
        // }, 300000); // 5 minutes
        
        // Send conversation starters every 30 minutes if server is quiet - DISABLED
        // setInterval(async () => {
        //     await this.sendConversationStarter(client);
        // }, 1800000); // 30 minutes
        
        // Ping inactive members every 2 hours - DISABLED
        // setInterval(async () => {
        //     await this.pingInactiveMembers(client);
        // }, 7200000); // 2 hours
        
        console.log('✅ Activity monitoring system started!');
    },
    
    async checkActivity(client) {
        try {
            const guild = client.guilds.cache.get('1421592736221626572'); // Section42 main server
            if (!guild) return;
            
            const activityLevel = client.activityTracker.getActivityLevel();
            const stats = client.activityTracker.getDailyStats();
            
            // Find moderator channel
            const modChannel = guild.channels.cache.find(channel => 
                channel.name === 'staff-chat' || 
                channel.name === 'mod-logs' ||
                channel.name === 'staff'
            );
            
            // Alert mods if activity is low
            if (activityLevel.level === 'DEAD' && stats.today < 5) {
                if (modChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚨 Activity Alert: Server is DEAD')
                        .setDescription('Server activity is extremely low. Consider taking action to boost engagement!')
                        .setColor('#e74c3c')
                        .addFields(
                            {
                                name: '📊 Current Stats',
                                value: `• Today's messages: ${stats.today}\n• Activity level: ${activityLevel.emoji} ${activityLevel.level}`,
                                inline: false
                            },
                            {
                                name: '💡 Suggested Actions',
                                value: '• Start a conversation in general-chat\n• Create a poll or giveaway\n• Ping some active members\n• Host a voice chat event',
                                inline: false
                            }
                        )
                        .setTimestamp();
                    
                    await modChannel.send({ embeds: [embed] });
                }
            }
            
        } catch (error) {
            console.error('Error in activity monitoring:', error);
        }
    },
    
    async sendConversationStarter(client) {
        try {
            // Check if monitoring is enabled
            if (client.botMonitoring && !client.botMonitoring.enabled) return;
            if (client.botMonitoring && !client.botMonitoring.conversationStarters) return;
            
            const guild = client.guilds.cache.get('1421592736221626572');
            if (!guild) return;
            
            const activityLevel = client.activityTracker.getActivityLevel();
            
            // Only send if server is quiet or slow
            if (activityLevel.level === 'DEAD' || activityLevel.level === 'SLOW') {
                const generalChannel = guild.channels.cache.find(channel => 
                    channel.name === 'general-chat' || 
                    channel.name === 'general'
                );
                
                if (!generalChannel) return;
                
                // Always ping someone (100% chance now)
                // Get active members for pinging
                const leaderboard = client.activityTracker.getLeaderboard(10);
                if (leaderboard.length > 0) {
                    // Filter out members who were recently pinged
                    const recentPings = client.recentPings || new Set();
                    const availableMembers = leaderboard.filter(member => 
                        !recentPings.has(member.userId)
                    );
                    
                    if (availableMembers.length > 0) {
                        const randomMember = availableMembers[Math.floor(Math.random() * Math.min(5, availableMembers.length))];
                        const member = guild.members.cache.get(randomMember.userId);
                        
                        if (member) {
                            // Track this ping
                            if (!client.recentPings) {
                                client.recentPings = new Set();
                            }
                            client.recentPings.add(randomMember.userId);
                            
                            // Clean up old pings (older than 1 hour)
                            setTimeout(() => {
                                client.recentPings.delete(randomMember.userId);
                            }, 3600000); // 1 hour
                            
                            const pingMessages = [
                                `Hey ${member.user.toString()}, respond to this.`,
                                `${member.user.toString()}, your input needed.`,
                                `Ping: ${member.user.toString()}. Respond.`,
                                `${member.user.toString()}, server needs activity.`,
                                `${member.user.toString()}, time to engage.`
                            ];
                            
                            const randomPingMessage = pingMessages[Math.floor(Math.random() * pingMessages.length)];
                            await generalChannel.send(randomPingMessage);
                            return;
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('Error sending conversation starter:', error);
        }
    },
    
    async pingInactiveMembers(client) {
        try {
            // Check if monitoring is enabled
            if (client.botMonitoring && !client.botMonitoring.enabled) return;
            if (client.botMonitoring && !client.botMonitoring.inactivePings) return;
            
            const guild = client.guilds.cache.get('1421592736221626572');
            if (!guild) return;
            
            const activityLevel = client.activityTracker.getActivityLevel();
            
            // Only ping inactive members if server is very quiet
            if (activityLevel.level === 'DEAD') {
                const generalChannel = guild.channels.cache.find(channel => 
                    channel.name === 'general-chat' || 
                    channel.name === 'general'
                );
                
                if (!generalChannel) return;
                
                // Get inactive members (3+ days)
                const inactiveMembers = client.activityTracker.getInactiveUsers(72); // 3 days
                
                if (inactiveMembers.length > 0) {
                    // Filter out members who were recently pinged for inactivity
                    const recentInactivePings = client.recentInactivePings || new Set();
                    const availableInactive = inactiveMembers.filter(member => 
                        !recentInactivePings.has(member.userId)
                    );
                    
                    if (availableInactive.length > 0) {
                        // Pick 1-3 random inactive members
                        const numToPing = Math.min(3, availableInactive.length);
                        const selectedMembers = [];
                        
                        for (let i = 0; i < numToPing; i++) {
                            const randomIndex = Math.floor(Math.random() * availableInactive.length);
                            selectedMembers.push(availableInactive[randomIndex]);
                            availableInactive.splice(randomIndex, 1);
                        }
                        
                        // Track these pings
                        if (!client.recentInactivePings) {
                            client.recentInactivePings = new Set();
                        }
                        
                        selectedMembers.forEach(member => {
                            client.recentInactivePings.add(member.userId);
                            
                            // Clean up old pings (older than 6 hours)
                            setTimeout(() => {
                                client.recentInactivePings.delete(member.userId);
                            }, 21600000); // 6 hours
                        });
                        
                        // Create wake up messages
                        const wakeUpMessages = [
                            "Server is quiet! Time to wake up!",
                            "The server needs your input!",
                            "Hello? Is anyone there?",
                            "Rise and shine! Server needs activity!",
                            "Wake up call! The server misses you!",
                            "Server's getting lonely... come back!",
                            "Time to be active! Where is everyone?",
                            "Activity required! Server needs your presence!",
                            "Energy boost needed! Come chat!"
                        ];
                        
                        const randomMessage = wakeUpMessages[Math.floor(Math.random() * wakeUpMessages.length)];
                        
                        // Create member mentions
                        const memberMentions = selectedMembers.map(member => {
                            const guildMember = guild.members.cache.get(member.userId);
                            return guildMember ? guildMember.user.toString() : 'Unknown User';
                        }).join(' ');
                        
                        await generalChannel.send(`${randomMessage}\n\n${memberMentions}\n\n*The server has been quiet for a while. Come say hi!*`);
                        
                        console.log(`📢 Pinged ${numToPing} inactive members: ${selectedMembers.map(m => m.userId).join(', ')}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error pinging inactive members:', error);
        }
    }
};
