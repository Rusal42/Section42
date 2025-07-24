const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'userid',
    description: 'Get a user\'s Discord ID and account information',
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

            // Get target user (mention or default to command author)
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
            
            // If still no user, default to command author
            if (!targetUser) {
                targetUser = message.author;
            }

            // Get member object (might be null if user is not in server)
            const targetMember = message.guild.members.cache.get(targetUser.id);

            // Calculate account creation date from Discord snowflake
            const discordEpoch = 1420070400000n;
            const createdAt = new Date(Number((BigInt(targetUser.id) >> 22n) + discordEpoch));
            const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

            // Create user ID embed
            const useridEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('🆔 User ID Information')
                .setDescription(`Discord ID and account details for ${targetUser.tag}`)
                .addFields(
                    {
                        name: '👤 User',
                        value: `**Username:** ${targetUser.username}\n**Tag:** ${targetUser.tag}\n**Mention:** ${targetUser}`,
                        inline: true
                    },
                    {
                        name: '🆔 Discord ID',
                        value: `\`${targetUser.id}\``,
                        inline: true
                    },
                    {
                        name: '📊 Status',
                        value: `**In Server:** ${targetMember ? '✅ Yes' : '❌ No'}\n**Bot Account:** ${targetUser.bot ? '🤖 Yes' : '👤 No'}`,
                        inline: true
                    },
                    {
                        name: '📅 Account Created',
                        value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>\n*${accountAge} days ago*`,
                        inline: false
                    },
                    {
                        name: '💡 Usage Examples',
                        value: `\`!ban ${targetUser.id} [reason]\`\n\`!warn ${targetUser.id} <reason>\`\n\`!whois ${targetUser.id}\``,
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            message.reply({ embeds: [useridEmbed] });

            console.log(`🆔 ${message.author.tag} viewed user ID for ${targetUser.tag}`);

        } catch (error) {
            console.error('Error executing userid command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while retrieving user ID information.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
