const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'snipelist',
    description: 'Show multiple recently deleted messages',
    data: new SlashCommandBuilder()
        .setName('snipelist')
        .setDescription('Show multiple recently deleted messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of deleted messages to show (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),
    
    async execute(message, args) {
        const snipedMessages = message.client.snipeList.get(message.channel.id);
        
        if (!snipedMessages || snipedMessages.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('No Deleted Messages')
                .setDescription('There are no recently deleted messages in this channel.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const amount = parseInt(args[0]) || 5;
        const messagesToShow = snipedMessages.slice(0, amount);

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`🔍 Last ${messagesToShow.length} Deleted Messages`)
            .setFooter({ 
                text: `Requested by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setTimestamp();

        messagesToShow.forEach((msg, index) => {
            const timeAgo = Math.floor((Date.now() - msg.deletedAt.getTime()) / 1000);
            const timeString = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
            
            embed.addFields({
                name: `${index + 1}. ${msg.author.tag} (${timeString})`,
                value: msg.content ? (msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content) : '*No text content*',
                inline: false
            });
        });

        message.channel.send({ embeds: [embed] });
    },

    async executeSlash(interaction) {
        const snipedMessages = interaction.client.snipeList.get(interaction.channel.id);
        
        if (!snipedMessages || snipedMessages.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('No Deleted Messages')
                .setDescription('There are no recently deleted messages in this channel.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount') || 5;
        const messagesToShow = snipedMessages.slice(0, amount);

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`🔍 Last ${messagesToShow.length} Deleted Messages`)
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        messagesToShow.forEach((msg, index) => {
            const timeAgo = Math.floor((Date.now() - msg.deletedAt.getTime()) / 1000);
            const timeString = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
            
            embed.addFields({
                name: `${index + 1}. ${msg.author.tag} (${timeString})`,
                value: msg.content ? (msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content) : '*No text content*',
                inline: false
            });
        });

        interaction.reply({ embeds: [embed] });
    }
};
