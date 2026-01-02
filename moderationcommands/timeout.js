const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'timeout',
    description: 'Timeout (mute) a member for a specified duration',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Moderate Members** permission to use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            let targetUser = message.mentions.users.first();
            
            if (!targetUser && args[0]) {
                const userId = args[0].replace(/[<@!>]/g, '');
                try {
                    targetUser = await message.client.users.fetch(userId);
                } catch (error) {
                }
            }
            
            if (!targetUser) {
                const usageEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Command Usage')
                    .setDescription('**Usage:** `!timeout @user <duration> [reason]` or `!timeout <userID> <duration> [reason]`')
                    .addFields(
                        {
                            name: 'Duration Examples',
                            value: '• `30s` - 30 seconds\n• `5m` - 5 minutes\n• `1h` - 1 hour\n• `1d` - 1 day\n• `1w` - 1 week',
                            inline: true
                        },
                        {
                            name: 'Examples',
                            value: '`!timeout @user 10m Spamming`\n`!timeout 123456789012345678 10m Spamming`',
                            inline: true
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            const duration = args[1];
            if (!duration) {
                const noDurationEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Missing Duration')
                    .setDescription('Please specify a duration (e.g., 30s, 5m, 1h, 1d)')
                    .setTimestamp();
                
                return message.reply({ embeds: [noDurationEmbed] });
            }

            const timeRegex = /^(\d+)([smhdw])$/;
            const match = duration.match(timeRegex);
            
            if (!match) {
                const invalidDurationEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Invalid Duration')
                    .setDescription('Duration format: `30s`, `5m`, `1h`, `1d`, `1w`')
                    .setTimestamp();
                
                return message.reply({ embeds: [invalidDurationEmbed] });
            }

            const amount = parseInt(match[1]);
            const unit = match[2];
            
            let milliseconds;
            let displayDuration;
            
            switch (unit) {
                case 's':
                    milliseconds = amount * 1000;
                    displayDuration = `${amount} second${amount !== 1 ? 's' : ''}`;
                    break;
                case 'm':
                    milliseconds = amount * 60 * 1000;
                    displayDuration = `${amount} minute${amount !== 1 ? 's' : ''}`;
                    break;
                case 'h':
                    milliseconds = amount * 60 * 60 * 1000;
                    displayDuration = `${amount} hour${amount !== 1 ? 's' : ''}`;
                    break;
                case 'd':
                    milliseconds = amount * 24 * 60 * 60 * 1000;
                    displayDuration = `${amount} day${amount !== 1 ? 's' : ''}`;
                    break;
                case 'w':
                    milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
                    displayDuration = `${amount} week${amount !== 1 ? 's' : ''}`;
                    break;
            }

            const maxTimeout = 28 * 24 * 60 * 60 * 1000;
            if (milliseconds > maxTimeout) {
                const tooLongEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Duration Too Long')
                    .setDescription('Maximum timeout duration is 28 days.')
                    .setTimestamp();
                
                return message.reply({ embeds: [tooLongEmbed] });
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);
            if (!targetMember) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ User Not Found')
                    .setDescription('That user is not in this server.')
                    .setTimestamp();
                
                return message.reply({ embeds: [notFoundEmbed] });
            }

            if (!targetMember.moderatable) {
                const cantTimeoutEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Cannot Timeout User')
                    .setDescription('I cannot timeout this user. They may have higher permissions than me.')
                    .setTimestamp();
                
                return message.reply({ embeds: [cantTimeoutEmbed] });
            }

            const reason = args.slice(2).join(' ') || 'No reason provided';

            await targetMember.timeout(milliseconds, reason);

            const endTime = new Date(Date.now() + milliseconds);

            const successEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('🔇 User Timed Out')
                .setDescription(`Successfully timed out ${targetUser.tag}`)
                .addFields(
                    {
                        name: '👤 Timed Out User',
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value: `${message.author.tag}`,
                        inline: true
                    },
                    {
                        name: '⏰ Duration',
                        value: displayDuration,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason,
                        inline: false
                    },
                    {
                        name: '🕐 Timeout Ends',
                        value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`,
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Moderation Action', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [successEmbed] });

            console.log(`🔇 ${message.author.tag} timed out ${targetUser.tag} for ${displayDuration}: ${reason}`);

        } catch (error) {
            console.error('Error executing timeout command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to timeout the user.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
