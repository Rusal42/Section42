const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'announce',
    description: 'Send an announcement embed',
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement embed')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true)),
    async execute(message, args) {
        if (!OWNER_IDS.includes(message.author.id) && !message.member.permissions.has('Administrator')) {
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
        if (!OWNER_IDS.includes(interaction.user.id) && !interaction.member.permissions.has('Administrator')) {
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
