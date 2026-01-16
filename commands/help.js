const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Shows all available commands',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('Section42 Bot Commands')
            .setDescription('Here are all the available commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**Embed Commands**',
                    value: '`!embed <title> | <description> | [color] | [footer]` - Create custom embed\n' +
                           '`!announce <message>` - Create announcement embed (Admin only)\n' +
                           '`!info <title> | <description>` - Create info embed\n' +
                           '`!say <message>` - Make the bot say something\n' +
                           '`!poll <question> | <option1> | <option2> | [option3] | [option4]` - Create a poll',
                    inline: false
                },
                {
                    name: '**General Commands**',
                    value: '`!ping` - Check bot latency\n' +
                           '`!colors` - Get color roles\n' +
                           '`!giveaway <duration> <winners> | <prize>` - Start a giveaway\n' +
                           '`!help` - Show this help message',
                    inline: false
                },
                {
                    name: '**Moderation Commands**',
                    value: '`!ban <user> [reason]` - Ban a user\n' +
                           '`!kick <user> [reason]` - Kick a user\n' +
                           '`!timeout <user> <duration> [reason]` - Timeout a user\n' +
                           '`!purge <amount>` - Delete multiple messages (1-100)\n' +
                           '`!userpurge <user> <amount>` - Delete messages from a specific user\n' +
                           '`!snipe` - Show the last deleted message\n' +
                           '`!snipelist [amount]` - Show multiple deleted messages (default: 5)\n' +
                           '`!warn <user> <reason>` - Warn a user\n' +
                           '`!warnings <user>` - Check user warnings\n' +
                           '`!clearwarnings <user>` - Clear user warnings\n' +
                           '`!whois <user>` - Get user information\n' +
                           '`!av <user>` - Get user avatar\n' +
                           '`!userid <user>` - Get user ID\n' +
                           '`!modhelp` - Moderation help',
                    inline: false
                },
                {
                    name: '**Server Setup Commands**',
                    value: '`!setup` - Set up Section42 community server (Owner only)\n' +
                           '`!servupdate` - Update specific parts of server setup (Owner only)\n' +
                           '`!servclear` - Clear server channels (Owner only)\n' +
                           '`!sendserverinfo` - Send comprehensive server info with graphic design services\n' +
                           '`!sendcolors` - Send color role selection\n' +
                           '`!sendrules` - Send server rules',
                    inline: false
                },
                {
                    name: '**Meowlock Commands (Owner Only)**',
                    value: '`!meowlock <user> <meow|nya>` - Lock user to only say meow/nya\n' +
                           '`!meowunlock <user>` - Remove meowlock from user\n' +
                           '`!meowlocked` - List all meowlocked users\n' +
                           '`!meowlockclear` - Clear all meowlocks in server',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot by crucifyym', 
                iconURL: message.guild.iconURL() 
            })
            .setThumbnail(message.client.user.displayAvatarURL());

        await message.channel.send({ embeds: [embed] });
    },
    async executeSlash(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Section42 Bot Commands')
            .setDescription('Here are all the available commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**Embed Commands**',
                    value: '`/embed` or `!embed <title> | <description> | [color] | [footer]` - Create custom embed\n' +
                           '`/announce` or `!announce <message>` - Create announcement embed (Admin only)\n' +
                           '`/info` or `!info <title> | <description>` - Create info embed\n' +
                           '`/say` or `!say <message>` - Make the bot say something\n' +
                           '`/poll` or `!poll <question> | <option1> | <option2> | [option3] | [option4]` - Create a poll',
                    inline: false
                },
                {
                    name: '**General Commands**',
                    value: '`/ping` or `!ping` - Check bot latency\n' +
                           '`/colors` or `!colors` - Get color roles\n' +
                           '`/giveaway` or `!giveaway <duration> <winners> | <prize>` - Start a giveaway\n' +
                           '`/help` or `!help` - Show this help message',
                    inline: false
                },
                {
                    name: '**Moderation Commands**',
                    value: '`/purge` or `!purge <amount>` - Delete multiple messages (1-100)\n' +
                           '`/userpurge` or `!userpurge <user> <amount>` - Delete messages from a specific user\n' +
                           '`/snipe` or `!snipe` - Show the last deleted message\n' +
                           '`/snipelist` or `!snipelist [amount]` - Show multiple deleted messages (default: 5)\n' +
                           '`!ban <user> [reason]` - Ban a user\n' +
                           '`!kick <user> [reason]` - Kick a user\n' +
                           '`!timeout <user> <duration> [reason]` - Timeout a user\n' +
                           '`!warn <user> <reason>` - Warn a user\n' +
                           '`!warnings <user>` - Check user warnings\n' +
                           '`!clearwarnings <user>` - Clear user warnings\n' +
                           '`!whois <user>` - Get user information\n' +
                           '`!av <user>` - Get user avatar\n' +
                           '`!userid <user>` - Get user ID\n' +
                           '`!modhelp` - Moderation help',
                    inline: false
                },
                {
                    name: '**Server Setup Commands**',
                    value: '`!setup` - Set up Section42 community server (Owner only)\n' +
                           '`!servupdate` - Update specific parts of server setup (Owner only)\n' +
                           '`!servclear` - Clear server channels (Owner only)\n' +
                           '`!sendserverinfo` - Send comprehensive server info with graphic design services\n' +
                           '`!sendcolors` - Send color role selection\n' +
                           '`!sendrules` - Send server rules',
                    inline: false
                },
                {
                    name: '**Meowlock Commands (Owner Only)**',
                    value: '`!meowlock <user> <meow|nya>` - Lock user to only say meow/nya\n' +
                           '`!meowunlock <user>` - Remove meowlock from user\n' +
                           '`!meowlocked` - List all meowlocked users\n' +
                           '`!meowlockclear` - Clear all meowlocks in server',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot by crucifyym', 
                iconURL: interaction.guild.iconURL() 
            })
            .setThumbnail(interaction.client.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
