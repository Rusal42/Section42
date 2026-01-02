const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Kick Members** permission to use this command.')
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
                    .setDescription('**Usage:** `!kick @user [reason]` or `!kick <userID> [reason]`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!kick @baduser Spamming in chat`\n`!kick 123456789012345678 Spamming in chat`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);
            if (!targetMember) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('User Not Found')
                    .setDescription('That user is not in this server.')
                    .setTimestamp();
                
                return message.reply({ embeds: [notFoundEmbed] });
            }

            if (!targetMember.kickable) {
                const cantKickEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Cannot Kick User')
                    .setDescription('I cannot kick this user. They may have higher permissions than me.')
                    .setTimestamp();
                
                return message.reply({ embeds: [cantKickEmbed] });
            }

            const reason = args.slice(1).join(' ') || 'No reason provided';

            await targetMember.kick(reason);
            const successEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('User Kicked')
                .setDescription(`Successfully kicked ${targetUser.tag}`)
                .addFields(
                    {
                        name: 'Kicked User',
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: true
                    },
                    {
                        name: 'Moderator',
                        value: `${message.author.tag}`,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: reason,
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Moderation Action', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [successEmbed] });

            console.log(`${message.author.tag} kicked ${targetUser.tag} for: ${reason}`);

        } catch (error) {
            console.error('Error executing kick command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while trying to kick the user.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
