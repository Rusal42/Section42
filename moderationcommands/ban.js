const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Ban Members** permission to use this command.')
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
                    .setDescription('**Usage:** `!ban @user [reason]` or `!ban <userID> [reason]`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!ban @baduser Repeated rule violations`\n`!ban 123456789012345678 Repeated rule violations`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);
            
            if (targetMember && !targetMember.bannable) {
                const cantBanEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Cannot Ban User')
                    .setDescription('I cannot ban this user. They may have higher permissions than me.')
                    .setTimestamp();
                
                return message.reply({ embeds: [cantBanEmbed] });
            }

            const reason = args.slice(1).join(' ') || 'No reason provided';

            await message.guild.members.ban(targetUser, { 
                reason: reason,
                deleteMessageDays: 1
            });
            const successEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('User Banned')
                .setDescription(`Successfully banned ${targetUser.tag}`)
                .addFields(
                    {
                        name: 'Banned User',
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
                    },
                    {
                        name: 'Message Cleanup',
                        value: 'Messages from the last 24 hours deleted',
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Moderation Action', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [successEmbed] });

            console.log(`${message.author.tag} banned ${targetUser.tag} for: ${reason}`);

        } catch (error) {
            console.error('Error executing ban command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while trying to ban the user.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
