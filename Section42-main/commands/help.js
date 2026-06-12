const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');
const { getGuildConfig } = require('../config/guildConfigs');

module.exports = {
    name: 'help',
    description: 'Shows available commands based on permissions',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows available commands based on permissions'),
    async execute(message, args) {
        const isOwner = OWNER_IDS.includes(message.author.id);
        const isMod = message.member.permissions.has('ManageMessages') || 
                     message.member.permissions.has('KickMembers') || 
                     message.member.permissions.has('BanMembers');
        
        let embed;
        
        if (isOwner) {
            // Owners get directed to use !crucify
            embed = new EmbedBuilder()
                .setTitle('🔑 Owner Access')
                .setDescription('As the bot owner, please use `!crucify` to view your owner commands.')
                .setColor('#ff6b35')
                .addFields({
                    name: '**Quick Access**',
                    value: '`!crucify` - View all owner commands\n`!modhelp` - View moderator commands\n`!help` - View fun commands (shown below)',
                    inline: false
                })
                .addField('🔧 Meowlock Commands (Owner Only)', '`!arrise` - Sequentially ping random users\n`!fall` - Stop the arrise sequence\n`!dm` - Send Discord-compliant DMs\n`!crucify` - Show owner commands\n`!shutup` - Toggle bot monitoring\n`!wake` - Enable bot monitoring')
                .addFields({
                    name: '**Fun Commands**',
                    value: '`!pick` - Ping a random person in the server',
                    inline: false
                },
                {
                    name: '**Embed Commands**',
                    value: '`!embed <title> | <description> | [color] | [footer]` - Create custom embed\n' +
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
                           '`!help` - Show this help message\n' +
                           '`!welcome <user>` - Manually welcome someone (Mod+)\n' +
                           '`!greeter` - Show top community greeters\n' +
                           '`!activity [type]` - Show server activity stats/leaderboard',
                    inline: false
                });
        } else if (isMod) {
            // Moderators get choice between mod and fun
            embed = new EmbedBuilder()
                .setTitle('🛡️ Moderator Access')
                .setDescription('You have access to both moderation and fun commands!')
                .setColor('#ff6b35')
                .addFields({
                    name: '**Choose Your Help**',
                    value: '`!modhelp` - View all moderation commands\n`!help` - View fun commands (shown below)',
                    inline: false
                });
        } else {
            // Regular users only see fun commands
            const guildCfg = getGuildConfig(message.guild.id);
            embed = new EmbedBuilder()
                .setTitle(`🎮 ${guildCfg.NAME} Bot - Fun Commands`)
                .setDescription('Welcome! Here are the fun commands you can use:')
                .setColor(guildCfg.COLOR);
        }
        
        // Add fun commands for everyone
        embed.addFields(
            {
                name: '**Fun Commands**',
                value: '`!pick` - Ping a random person in the server',
                inline: false
            },
            {
                name: '**Embed Commands**',
                value: '`!embed <title> | <description> | [color] | [footer]` - Create custom embed\n' +
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
                       '`!help` - Show this help message\n' +
                       '`!welcome <user>` - Manually welcome someone (Mod+)\n' +
                       '`!greeter` - Show top community greeters\n' +
                       '`!activity [type]` - Show server activity stats/leaderboard',
                inline: false
            }
        )
        .setTimestamp()
        .setFooter({ 
            text: getGuildConfig(message.guild.id).FOOTER, 
            iconURL: message.guild.iconURL() 
        })
        .setThumbnail(message.client.user.displayAvatarURL());

        await message.channel.send({ embeds: [embed] });
    },
    async executeSlash(interaction) {
        const isOwner = OWNER_IDS.includes(interaction.user.id);
        const isMod = interaction.member.permissions.has('ManageMessages') || 
                     interaction.member.permissions.has('KickMembers') || 
                     interaction.member.permissions.has('BanMembers');
        
        let embed;
        
        if (isOwner) {
            // Owners get directed to use !crucify
            embed = new EmbedBuilder()
                .setTitle('🔑 Owner Access')
                .setDescription('As the bot owner, please use `/crucify` to view your owner commands.')
                .setColor('#ff6b35')
                .addFields({
                    name: '**Quick Access**',
                    value: '`/crucify` - View all owner commands\n`/modhelp` - View moderator commands\n`/help` - View fun commands (shown below)',
                    inline: false
                });
        } else if (isMod) {
            // Moderators get choice between mod and fun
            embed = new EmbedBuilder()
                .setTitle('🛡️ Moderator Access')
                .setDescription('You have access to both moderation and fun commands!')
                .setColor('#ff6b35')
                .addFields({
                    name: '**Choose Your Help**',
                    value: '`/modhelp` - View all moderation commands\n`/help` - View fun commands (shown below)',
                    inline: false
                });
        } else {
            // Regular users only see fun commands
            const guildCfgSlash = getGuildConfig(interaction.guild.id);
            embed = new EmbedBuilder()
                .setTitle(`🎮 ${guildCfgSlash.NAME} Bot - Fun Commands`)
                .setDescription('Welcome! Here are the fun commands you can use:')
                .setColor(guildCfgSlash.COLOR);
        }
        
        // Add fun commands for everyone
        embed.addFields(
            {
                name: '**Fun Commands**',
                value: '`/pick` - Ping a random person in the server',
                inline: false
            },
            {
                name: '**Embed Commands**',
                value: '`/embed <title> | <description> | [color] | [footer]` - Create custom embed\n' +
                       '`/info <title> | <description>` - Create info embed\n' +
                       '`/say <message>` - Make the bot say something\n' +
                       '`/poll <question> | <option1> | <option2> | [option3] | [option4]` - Create a poll',
                inline: false
            },
            {
                name: '**General Commands**',
                value: '`/ping` - Check bot latency\n' +
                       '`/colors` - Get color roles\n' +
                       '`/giveaway <duration> <winners> | <prize>` - Start a giveaway\n' +
                       '`/help` - Show this help message',
                inline: false
            }
        )
        .setTimestamp()
        .setFooter({ 
            text: getGuildConfig(interaction.guild.id).FOOTER, 
            iconURL: interaction.guild.iconURL() 
        })
        .setThumbnail(interaction.client.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
