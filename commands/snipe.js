const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'snipe',
    description: 'Show the last deleted message',
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Show the last deleted message'),
    
    async execute(message, args) {
        const snipedMessage = message.client.snipes.get(message.channel.id);
        
        if (!snipedMessage) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('No Deleted Messages')
                .setDescription('There are no recently deleted messages in this channel.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🔍 Sniped Message')
            .setDescription(snipedMessage.content || '*No text content*')
            .setAuthor({ 
                name: snipedMessage.author.tag, 
                iconURL: snipedMessage.author.displayAvatarURL() 
            })
            .setFooter({ 
                text: `Sniped by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setTimestamp(snipedMessage.deletedAt);

        if (snipedMessage.attachment) {
            embed.setImage(snipedMessage.attachment);
        }

        message.channel.send({ embeds: [embed] });
    },

    async executeSlash(interaction) {
        const snipedMessage = interaction.client.snipes.get(interaction.channel.id);
        
        if (!snipedMessage) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('No Deleted Messages')
                .setDescription('There are no recently deleted messages in this channel.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🔍 Sniped Message')
            .setDescription(snipedMessage.content || '*No text content*')
            .setAuthor({ 
                name: snipedMessage.author.tag, 
                iconURL: snipedMessage.author.displayAvatarURL() 
            })
            .setFooter({ 
                text: `Sniped by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp(snipedMessage.deletedAt);

        if (snipedMessage.attachment) {
            embed.setImage(snipedMessage.attachment);
        }

        interaction.reply({ embeds: [embed] });
    }
};
