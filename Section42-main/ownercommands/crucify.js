const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'crucify',
    description: 'Show owner-only commands (Owner only)',
    data: new SlashCommandBuilder()
        .setName('crucify')
        .setDescription('Show owner-only commands (Owner only)'),
    ownerOnly: true,
    
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🔑 Owner Commands - crucifyym')
            .setDescription('Here are all the owner-only commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**Server Setup Commands**',
                    value: '`!setup` - Set up Section42 community server\n' +
                           '`!servupdate` - Update specific parts of server setup\n' +
                           '`!servclear` - Clear server channels\n' +
                           '`!sendserverinfo` - Send comprehensive server info\n' +
                           '`!sendcolors` - Send color role selection\n' +
                           '`!sendrules` - Send server rules',
                    inline: false
                },
                {
                    name: '**Meowlock Commands**',
                    value: '`!meowlock <user> <meow|nya>` - Lock user to only say meow/nya\n' +
                           '`!meowunlock <user>` - Remove meowlock from user\n' +
                           '`!meowlocked` - List all meowlocked users\n' +
                           '`!meowlockclear` - Clear all meowlocks in server',
                    inline: false
                },
                {
                    name: '**Fun & Utility Commands**',
                    value: '`!arrise` - Start sequential random pinging (auto-stops when everyone pinged)\n' +
                           '`!fall` - Stop the arrise sequence\n' +
                           '`!dm <user> [message]` - Send Discord-compliant DM to user',
                    inline: false
                },
                {
                    name: '**Dangerous Commands**',
                    value: '`!nukeall` - Delete all channels and roles (⚠️ EXTREMELY DANGEROUS)',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot by crucifyym - Owner Commands', 
                iconURL: message.guild.iconURL() 
            })
            .setThumbnail(message.client.user.displayAvatarURL());

        await message.channel.send({ embeds: [embed] });
    },
    
    async executeSlash(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔑 Owner Commands - crucifyym')
            .setDescription('Here are all the owner-only commands for the Section42 bot!')
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '**Server Setup Commands**',
                    value: '`!setup` - Set up Section42 community server\n' +
                           '`!servupdate` - Update specific parts of server setup\n' +
                           '`!servclear` - Clear server channels\n' +
                           '`!sendserverinfo` - Send comprehensive server info\n' +
                           '`!sendcolors` - Send color role selection\n' +
                           '`!sendrules` - Send server rules',
                    inline: false
                },
                {
                    name: '**Meowlock Commands**',
                    value: '`!meowlock <user> <meow|nya>` - Lock user to only say meow/nya\n' +
                           '`!meowunlock <user>` - Remove meowlock from user\n' +
                           '`!meowlocked` - List all meowlocked users\n' +
                           '`!meowlockclear` - Clear all meowlocks in server',
                    inline: false
                },
                {
                    name: '**Fun & Utility Commands**',
                    value: '`!arrise` - Start sequential random pinging (auto-stops when everyone pinged)\n' +
                           '`!fall` - Stop the arrise sequence\n' +
                           '`!dm <user> [message]` - Send Discord-compliant DM to user',
                    inline: false
                },
                {
                    name: '**Dangerous Commands**',
                    value: '`!nukeall` - Delete all channels and roles (⚠️ EXTREMELY DANGEROUS)',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Section42 Bot by crucifyym - Owner Commands', 
                iconURL: interaction.guild.iconURL() 
            })
            .setThumbnail(interaction.client.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
