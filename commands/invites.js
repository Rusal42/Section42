const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const inviteTracker = require('../utils/inviteTracker');

module.exports = {
    name: 'invites',
    description: 'Track and view invite statistics',
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Track and view invite statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check invite count for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check (defaults to you)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show top inviters')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (5-25)')
                        .setMinValue(5)
                        .setMaxValue(25)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset invite data for a user (admin only)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'check') {
                await this.handleCheck(interaction);
            } else if (subcommand === 'leaderboard') {
                await this.handleLeaderboard(interaction);
            } else if (subcommand === 'reset') {
                await this.handleReset(interaction);
            }
        } catch (error) {
            console.error('Invites error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    async handleCheck(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const stats = inviteTracker.getStats(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`📨 Invite Stats - ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `**Total Invites:** ${stats.count}\n\n` +
                (stats.users.length > 0 
                    ? `**Recent Invites:**\n${stats.users.slice(-10).reverse().map(u => `<@${u.userId}> - ${new Date(u.date).toLocaleDateString()}`).join('\n')}`
                    : 'No invites tracked yet.')
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleLeaderboard(interaction) {
        const limit = interaction.options.getInteger('limit') || 10;
        const leaderboard = inviteTracker.getLeaderboard(interaction.guild, limit);

        if (leaderboard.length === 0) {
            return interaction.reply({
                content: 'No invite data yet. Invite tracking starts now!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🏆 Invite Leaderboard')
            .setDescription(`Top ${Math.min(limit, leaderboard.length)} inviters`)
            .setTimestamp();

        for (let i = 0; i < leaderboard.length; i++) {
            const entry = leaderboard[i];
            const user = await interaction.guild.members.fetch(entry.userId).catch(() => null);
            const name = user ? user.user.tag : 'Unknown User';
            
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            
            embed.addFields({
                name: `${medal} ${name}`,
                value: `${entry.count} invite${entry.count === 1 ? '' : 's'}`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },

    async handleReset(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        // Reset the data
        delete inviteTracker.inviteData[targetUser.id];
        inviteTracker.saveData();

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('✅ Invite Data Reset')
            .setDescription(`Reset invite count for ${targetUser.tag}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
