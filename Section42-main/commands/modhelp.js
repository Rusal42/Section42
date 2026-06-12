const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'modhelp',
    description: 'Show moderation commands (Moderator+ only)',
    data: new SlashCommandBuilder()
        .setName('modhelp')
        .setDescription('Show moderation commands (Moderator+ only)'),
    
    async execute(message, args) {
        // Check if user has moderator permissions
        if (!message.member.permissions.has('ManageMessages') && 
            !message.member.permissions.has('KickMembers') && 
            !message.member.permissions.has('BanMembers')) {
            return message.reply('This command is only available to moderators and above!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Moderator Commands')
            .setDescription('Here are all the moderation commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**User Management**',
                    value: '`!ban <user> [reason]` - Ban a user\n' +
                           '`!kick <user> [reason]` - Kick a user\n' +
                           '`!timeout <user> <duration> [reason]` - Timeout a user\n' +
                           '`!warn <user> <reason>` - Warn a user\n' +
                           '`!warnings <user>` - Check user warnings\n' +
                           '`!clearwarnings <user>` - Clear user warnings',
                    inline: false
                },
                {
                    name: '**Message Management**',
                    value: '`!purge <amount>` - Delete multiple messages (1-100)\n' +
                           '`!userpurge <user> <amount>` - Delete messages from a specific user\n' +
                           '`!snipe` - Show the last deleted message\n' +
                           '`!snipelist [amount]` - Show multiple deleted messages (default: 5)',
                    inline: false
                },
                {
                    name: '**User Information**',
                    value: '`!whois <user>` - Get user information\n' +
                           '`!av <user>` - Get user avatar\n' +
                           '`!userid <user>` - Get user ID',
                    inline: false
                },
                {
                    name: '**Server Management**',
                    value: '`!announce <message>` - Create announcement embed (Admin only)\n' +
                           '`!modhelp` - Show this moderation help',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot Moderator Commands', 
                iconURL: message.guild.iconURL() 
            })
            .setThumbnail(message.client.user.displayAvatarURL());

        await message.channel.send({ embeds: [embed] });
        
        // Also offer to show fun commands
        await message.channel.send('💡 Want to see the fun commands too? Use `!help` to view them!');
    },
    
    async executeSlash(interaction) {
        // Check if user has moderator permissions
        if (!interaction.member.permissions.has('ManageMessages') && 
            !interaction.member.permissions.has('KickMembers') && 
            !interaction.member.permissions.has('BanMembers')) {
            return await interaction.reply({
                content: 'This command is only available to moderators and above!',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Moderator Commands')
            .setDescription('Here are all the moderation commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**User Management**',
                    value: '`!ban <user> [reason]` - Ban a user\n' +
                           '`!kick <user> [reason]` - Kick a user\n' +
                           '`!timeout <user> <duration> [reason]` - Timeout a user\n' +
                           '`!warn <user> <reason>` - Warn a user\n' +
                           '`!warnings <user>` - Check user warnings\n' +
                           '`!clearwarnings <user>` - Clear user warnings',
                    inline: false
                },
                {
                    name: '**Message Management**',
                    value: '`!purge <amount>` - Delete multiple messages (1-100)\n' +
                           '`!userpurge <user> <amount>` - Delete messages from a specific user\n' +
                           '`!snipe` - Show the last deleted message\n' +
                           '`!snipelist [amount]` - Show multiple deleted messages (default: 5)',
                    inline: false
                },
                {
                    name: '**User Information**',
                    value: '`!whois <user>` - Get user information\n' +
                           '`!av <user>` - Get user avatar\n' +
                           '`!userid <user>` - Get user ID',
                    inline: false
                },
                {
                    name: '**Server Management**',
                    value: '`!announce <message>` - Create announcement embed (Admin only)\n' +
                           '`!modhelp` - Show this moderation help',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot Moderator Commands', 
                iconURL: interaction.guild.iconURL() 
            })
            .setThumbnail(interaction.client.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: true });
        
        // Also offer to show fun commands
        await interaction.followUp({
            content: '💡 Want to see the fun commands too? Use `/help` to view them!',
            ephemeral: true
        });
    }
};
