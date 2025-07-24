const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'av',
    description: 'Display a user\'s Discord profile picture',
    async execute(message, args) {
        try {
            // Check if user has manage messages permission (moderator+)
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Access Denied')
                    .setDescription('You need **Manage Messages** permission to use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            // Get target user (mention or ID)
            let targetUser = message.mentions.users.first();
            
            // If no mention, try to parse as user ID
            if (!targetUser && args[0]) {
                const userId = args[0].replace(/[<@!>]/g, ''); // Remove mention formatting if present
                try {
                    targetUser = await message.client.users.fetch(userId);
                } catch (error) {
                    // Invalid user ID
                }
            }
            
            // If no user specified, show the command author's avatar
            if (!targetUser) {
                targetUser = message.author;
            }

            // Get different avatar sizes and formats
            const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
            const avatarPNG = targetUser.displayAvatarURL({ format: 'png', size: 1024 });
            const avatarJPG = targetUser.displayAvatarURL({ format: 'jpg', size: 1024 });
            const avatarWEBP = targetUser.displayAvatarURL({ format: 'webp', size: 1024 });

            // Check if user has a custom avatar or is using default
            const hasCustomAvatar = targetUser.avatar !== null;

            const avatarEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle(`🖼️ ${targetUser.tag}'s Profile Picture`)
                .setDescription(hasCustomAvatar ? 'Custom profile picture' : 'Default Discord avatar')
                .setImage(avatarURL)
                .addFields(
                    {
                        name: '👤 User Info',
                        value: `**Username:** ${targetUser.username}\n**User ID:** ${targetUser.id}`,
                        inline: true
                    },
                    {
                        name: '📊 Avatar Info',
                        value: `**Type:** ${hasCustomAvatar ? 'Custom' : 'Default'}\n**Animated:** ${avatarURL.includes('.gif') ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: '🔗 Download Links',
                        value: `[PNG](${avatarPNG}) • [JPG](${avatarJPG}) • [WEBP](${avatarWEBP})${avatarURL.includes('.gif') ? ` • [GIF](${avatarURL})` : ''}`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            // Add server avatar if different from global avatar
            const targetMember = message.guild.members.cache.get(targetUser.id);
            if (targetMember && targetMember.avatar && targetMember.avatar !== targetUser.avatar) {
                const serverAvatarURL = targetMember.displayAvatarURL({ dynamic: true, size: 1024 });
                avatarEmbed.addFields({
                    name: '🏠 Server Avatar',
                    value: `This user has a different avatar in this server.\n[View Server Avatar](${serverAvatarURL})`,
                    inline: false
                });
            }

            message.reply({ embeds: [avatarEmbed] });

            console.log(`🖼️ ${message.author.tag} viewed avatar for ${targetUser.tag}`);

        } catch (error) {
            console.error('Error executing av command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while retrieving the avatar.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
