const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { activeGiveaways } = require('./start.js');

module.exports = {
    name: 'giveaway-cancel',
    description: 'Cancel an active giveaway immediately (no winners)',
    data: new SlashCommandBuilder()
        .setName('giveaway-cancel')
        .setDescription('Cancel an active giveaway immediately (no winners)')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The giveaway message ID (shown when giveaway started)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to cancel giveaways.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        const messageId = interaction.options.getString('message_id');
        const giveaway = activeGiveaways.get(messageId);

        if (!giveaway) {
            return interaction.reply({
                content: 'Giveaway not found. Make sure you copied the correct message ID, or the giveaway already ended.',
                flags: 64
            });
        }

        if (giveaway.ended) {
            return interaction.reply({
                content: 'This giveaway has already ended or been cancelled.',
                flags: 64
            });
        }

        // Clear the auto-end timer
        clearTimeout(giveaway.timeoutId);
        giveaway.ended = true;

        try {
            const channel = await interaction.client.channels.fetch(giveaway.channelId);
            const fetchedMessage = await channel.messages.fetch(messageId);

            const cancelledEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('GIVEAWAY CANCELLED')
                .setDescription(`**Prize:** ${giveaway.prize}\n\n**Status:** CANCELLED by host\n\n~~Click to enter!~~`)
                .setFooter({ text: `Hosted by ${giveaway.hostId} | Cancelled by ${interaction.user.tag}` })
                .setTimestamp();

            await fetchedMessage.edit({ embeds: [cancelledEmbed] });

            const notifyEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Giveaway Cancelled')
                .setDescription(`The giveaway for **${giveaway.prize}** has been cancelled by ${interaction.user}.`)
                .setTimestamp();

            await fetchedMessage.reply({ embeds: [notifyEmbed] });

            activeGiveaways.delete(messageId);

            await interaction.reply({ content: 'Giveaway cancelled successfully!', flags: 64 });

        } catch (error) {
            console.error('Error cancelling giveaway:', error);
            activeGiveaways.delete(messageId);
            await interaction.reply({ content: 'Error cancelling giveaway. It may have already been deleted.', flags: 64 });
        }
    }
};
