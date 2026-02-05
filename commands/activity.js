const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'activity',
    description: 'Show server activity stats and leaderboard',
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Show server activity stats and leaderboard')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Type of activity to show')
                .addChoices(
                    { name: 'leaderboard', value: 'leaderboard' },
                    { name: 'stats', value: 'stats' },
                    { name: 'inactive', value: 'inactive' }
                )
                .setRequired(false)),
    
    async execute(message, args) {
        const type = args[0] || 'leaderboard';
        await this.showActivity(message.client, message.channel, message.guild, type);
    },
    
    async executeSlash(interaction) {
        const type = interaction.options.getString('type') || 'leaderboard';
        await interaction.deferReply();
        await this.showActivity(interaction.client, interaction.channel, interaction.guild, type);
        await interaction.deleteReply();
    },
    
    async showActivity(client, channel, guild, type) {
        try {
            if (!client.activityTracker) {
                return await channel.send('📊 No activity data available yet. Start chatting to see stats!');
            }
            
            switch (type) {
                case 'stats':
                    await this.showServerStats(client, channel, guild);
                    break;
                case 'inactive':
                    await this.showInactiveUsers(client, channel, guild);
                    break;
                default:
                    await this.showLeaderboard(client, channel, guild);
            }
        } catch (error) {
            console.error('Error showing activity:', error);
            await channel.send('❌ Failed to load activity stats. Please try again later.');
        }
    },
    
    async showServerStats(client, channel, guild) {
        const stats = client.activityTracker.getDailyStats();
        const activityLevel = client.activityTracker.getActivityLevel();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Server Activity Stats')
            .setDescription(`Current activity level: ${activityLevel.emoji} **${activityLevel.level}**`)
            .setColor(activityLevel.color)
            .addFields(
                {
                    name: '📈 Daily Messages',
                    value: `• Today: **${stats.today}** messages\n• Yesterday: **${stats.yesterday}** messages\n• This week: **${stats.week}** messages\n• All time: **${stats.total}** messages`,
                    inline: false
                },
                {
                    name: '🎯 Activity Analysis',
                    value: activityLevel.level === 'DEAD' ? '🔴 Server is very quiet! Time to spark some conversations!' :
                          activityLevel.level === 'SLOW' ? '🟡 Server could be more active. Try starting some discussions!' :
                          activityLevel.level === 'MODERATE' ? '🟢 Server has decent activity. Keep it up!' :
                          activityLevel.level === 'ACTIVE' ? '🔥 Server is very active! Great community engagement!' :
                          '💥 Server is booming! Incredible activity!',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Activity updates every minute • More messages = better stats!', 
                iconURL: guild.iconURL() 
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    },
    
    async showLeaderboard(client, channel, guild) {
        const leaderboard = client.activityTracker.getLeaderboard(10);
        
        if (leaderboard.length === 0) {
            return await channel.send('📊 No activity data available yet. Start chatting to see stats!');
        }
        
        const embed = new EmbedBuilder()
            .title('🏆 Activity Leaderboard')
            .setDescription('Most active members in the server!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '🥇 Top 10 Most Active',
                    value: leaderboard.map((user, index) => {
                        const member = guild.members.cache.get(user.userId);
                        const username = member ? member.user.tag : 'Unknown User';
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                        return `${medal} **${username}** - ${user.messages} messages\n🔥 ${user.streak} day streak`;
                    }).join('\n\n'),
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Activity ranks update automatically • Keep chatting to climb the leaderboard!', 
                iconURL: guild.iconURL() 
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    },
    
    async showInactiveUsers(client, channel, guild) {
        const inactiveUsers = client.activityTracker.getInactiveUsers(72); // 3 days
        
        if (inactiveUsers.length === 0) {
            return await channel.send('🎉 Everyone has been active in the last 3 days! Great community engagement!');
        }
        
        const embed = new EmbedBuilder()
            .title('😴 Inactive Members (3+ days)')
            .setDescription(`Found ${inactiveUsers.length} members who haven't been active recently`)
            .setColor('#f39c12')
            .addFields(
                {
                    name: '📋 Inactive List',
                    value: inactiveUsers.slice(0, 10).map(user => {
                        const member = guild.members.cache.get(user.userId);
                        const username = member ? member.user.tag : 'Unknown User';
                        const lastSeen = new Date(user.lastSeen).toLocaleDateString();
                        return `• **${username}** - Last seen: ${lastSeen}`;
                    }).join('\n'),
                    inline: false
                },
                {
                    name: '💡 Suggestions',
                    value: '• Try pinging some of these members to bring them back\n• Send DMs asking how they\'re doing\n• Create events or discussions that might interest them',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Members inactive 3+ days • Consider reaching out to re-engage them!', 
                iconURL: guild.iconURL() 
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
};
