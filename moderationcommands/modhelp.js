const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'modhelp',
    description: 'Show all moderation commands and their usage',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Manage Messages** permission to use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            const helpEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('Section42 Moderation Commands')
                .setDescription('Complete guide to all available moderation commands')
                .addFields(
                    {
                        name: 'Kick Command',
                        value: '**Usage:** `!kick @user [reason]` or `!kick <userID> [reason]`\n**Permission:** Kick Members\n**Description:** Remove a user from the server',
                        inline: false
                    },
                    {
                        name: 'Ban Command',
                        value: '**Usage:** `!ban @user [reason]` or `!ban <userID> [reason]`\n**Permission:** Ban Members\n**Description:** Permanently ban a user and delete their recent messages',
                        inline: false
                    },
                    {
                        name: 'Timeout Command',
                        value: '**Usage:** `!timeout @user <duration> [reason]` or `!timeout <userID> <duration> [reason]`\n**Permission:** Moderate Members\n**Duration:** 5m, 1h, 1d, 1w (max 28 days)\n**Description:** Temporarily mute a user',
                        inline: false
                    },
                    {
                        name: 'Warn Command',
                        value: '**Usage:** `!warn @user <reason>` or `!warn <userID> <reason>`\n**Permission:** Manage Messages\n**Description:** Issue a warning to a user (tracked permanently)',
                        inline: false
                    },
                    {
                        name: 'Warnings Command',
                        value: '**Usage:** `!warnings @user` or `!warnings <userID>`\n**Permission:** Manage Messages\n**Description:** View all warnings for a specific user',
                        inline: false
                    },
                    {
                        name: 'Clear Warnings Command',
                        value: '**Usage:** `!clearwarnings @user [reason]` or `!clearwarnings <userID> [reason]`\n**Permission:** Administrator\n**Description:** Clear all warnings for a user (irreversible)',
                        inline: false
                    }
                )
                .addFields(
                    {
                        name: 'Utility Commands',
                        value: '**`!whois @user`** - View detailed user information\n**`!av @user`** - Display user\'s profile picture\n**`!modhelp`** - Show this help menu',
                        inline: false
                    },
                    {
                        name: 'Pro Tips',
                        value: '• You can use **user IDs** instead of mentions for all commands\n• User IDs work even if the user has left the server\n• Warning levels: 1 = Low, 2 = Moderate, 3+ = High Risk\n• All actions are logged and users are notified via DM',
                        inline: false
                    },
                    {
                        name: 'Permission Levels',
                        value: '**Manage Messages** - warn, warnings, whois, av\n**Kick Members** - kick\n**Ban Members** - ban\n**Moderate Members** - timeout\n**Administrator** - clearwarnings',
                        inline: false
                    }
                )
                .setThumbnail(message.guild.iconURL())
                .setTimestamp()
                .setFooter({ 
                    text: 'Section42 Moderation System | Use responsibly', 
                    iconURL: message.client.user.displayAvatarURL() 
                });

            message.reply({ embeds: [helpEmbed] });

            console.log(`${message.author.tag} viewed moderation help`);

        } catch (error) {
            console.error('Error executing modhelp command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while displaying the help menu.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
