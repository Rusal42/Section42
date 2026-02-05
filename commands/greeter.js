const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'greeter',
    description: 'Show top greeters and greeting stats',
    data: new SlashCommandBuilder()
        .setName('greeter')
        .setDescription('Show top greeters and greeting stats'),
    
    async execute(message, args) {
        await this.showGreeterStats(message.client, message.channel, message.guild);
    },
    
    async executeSlash(interaction) {
        await interaction.deferReply();
        await this.showGreeterStats(interaction.client, interaction.channel, interaction.guild);
        await interaction.deleteReply();
    },
    
    async showGreeterStats(client, channel, guild) {
        try {
            if (!client.welcomeTracker || !client.welcomeTracker.greetingResponses) {
                return await channel.send('📊 No greeting data available yet. Start welcoming new members to see stats!');
            }
            
            const responses = client.welcomeTracker.greetingResponses;
            
            if (responses.size === 0) {
                return await channel.send('📊 No one has greeted new members yet. Be the first! 👋');
            }
            
            // Sort by greeting count
            const sortedGreeters = Array.from(responses.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Top 10
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🏆 Top Community Greeters')
                .setDescription('These members are amazing at welcoming new people!')
                .setColor('#ff6b35')
                .addFields(
                    {
                        name: '👋 Top 10 Greeters',
                        value: sortedGreeters.map(([userId, count], index) => {
                            const user = client.users.cache.get(userId);
                            const username = user ? user.tag : 'Unknown User';
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                            return `${medal} **${username}** - ${count} greeting${count === 1 ? '' : 's'}`;
                        }).join('\n'),
                        inline: false
                    },
                    {
                        name: '📈 Community Stats',
                        value: `• Total greeters: ${responses.size}\n• Total greetings: ${Array.from(responses.values()).reduce((a, b) => a + b, 0)}\n• Most active: ${sortedGreeters[0] ? client.users.cache.get(sortedGreeters[0][0])?.tag || 'Unknown' : 'None'}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: 'Keep welcoming new members to build a friendly community! 🌟', 
                    iconURL: guild.iconURL() 
                })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error showing greeter stats:', error);
            await channel.send('❌ Failed to load greeter stats. Please try again later.');
        }
    }
};
