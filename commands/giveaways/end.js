const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { activeGiveaways, endGiveaway } = require('./start.js');

module.exports = {
    name: 'giveaway-end',
    description: 'End a giveaway early and pick winners',
    data: new SlashCommandBuilder()
        .setName('giveaway-end')
        .setDescription('End a giveaway early and pick winners')
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
                .setDescription('You need the **Manage Messages** permission to end giveaways.')
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
                content: 'This giveaway has already ended.',
                flags: 64
            });
        }

        // Clear the auto-end timer
        clearTimeout(giveaway.timeoutId);

        // End immediately
        await interaction.reply({ content: 'Ending giveaway early...', flags: 64 });
        await endGiveaway(interaction.client, messageId, giveaway.channelId);

        await interaction.followUp({ content: 'Giveaway ended successfully!', flags: 64 });
    }
};
