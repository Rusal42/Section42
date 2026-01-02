const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Create an announcement embed',
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Create an announcement embed')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true)),
    async execute(message, args) {
        const OWNER_ID = '746068840978448565';
        
        if (message.author.id !== OWNER_ID && !message.member.permissions.has('Administrator')) {
            return message.reply('Only the bot owner or administrators can use this command.');
        }

        await message.delete().catch(() => {});

        if (args.length === 0) {
            return message.channel.send('Usage: `!announce <message>`\n' +
                'Example: `!announce New Section42 game coming soon!`');
        }

        const announcement = args.join(' ').replace(/\\n/g, '\n');

        try {
            const embed = new EmbedBuilder()
                .setTitle('Section42 Announcement')
                .setDescription(announcement)
                .setColor('#ff6b35')
                .setTimestamp()
                .setFooter({ 
                    text: `Announced by ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setThumbnail(message.guild.iconURL());

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating announcement:', error);
            message.channel.send('Error creating announcement.');
        }
    },
    async executeSlash(interaction) {
        const OWNER_ID = '746068840978448565';
        
        if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'Only the bot owner or administrators can use this command.', ephemeral: true });
        }

        const announcement = interaction.options.getString('message').replace(/\\n/g, '\n');

        try {
            const embed = new EmbedBuilder()
                .setTitle('Section42 Announcement')
                .setDescription(announcement)
                .setColor('#ff6b35')
                .setTimestamp()
                .setFooter({ 
                    text: `Announced by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setThumbnail(interaction.guild.iconURL());

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating announcement:', error);
            await interaction.reply({ content: 'Error creating announcement.', ephemeral: true });
        }
    }
};
