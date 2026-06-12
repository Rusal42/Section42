const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getCounter, setCounter, removeCounter } = require('../utils/memberCounterStore');

module.exports = {
    name: 'membercounter',
    description: 'Set up or remove an auto-updating member count channel',
    data: new SlashCommandBuilder()
        .setName('membercounter')
        .setDescription('Set up or remove an auto-updating member count channel')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Create a locked voice channel that shows the member count')
                .addStringOption(opt =>
                    opt.setName('format')
                        .setDescription('Channel name format — use {count} as the placeholder (default: Members: {count})')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Delete the member counter channel and stop tracking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'You need **Manage Channels** permission to use this.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if (sub === 'setup') {
            const existing = getCounter(guild.id);
            if (existing) {
                const ch = guild.channels.cache.get(existing.channelId);
                if (ch) {
                    return interaction.reply({
                        content: `A member counter already exists: <#${ch.id}>\nRun \`/membercounter remove\` first to replace it.`,
                        ephemeral: true
                    });
                }
            }

            const format = interaction.options.getString('format') || 'Members: {count}';

            if (!format.includes('{count}')) {
                return interaction.reply({
                    content: 'Your format must include `{count}` so the bot knows where to put the number.',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const channelName = format.replace('{count}', guild.memberCount);

            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['Connect'],
                        allow: ['ViewChannel']
                    }
                ],
                reason: 'Member counter channel created by bot'
            });

            setCounter(guild.id, channel.id, format);

            const embed = new EmbedBuilder()
                .setColor('#cc00ff')
                .setTitle('✅ Member Counter Created')
                .setDescription(`<#${channel.id}> will now update automatically whenever someone joins or leaves.`)
                .addFields(
                    { name: 'Format', value: `\`${format}\``, inline: true },
                    { name: 'Current Count', value: `${guild.memberCount}`, inline: true }
                )
                .setFooter({ text: 'Move it to any category you want — the bot will still update it.' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'remove') {
            const existing = getCounter(guild.id);
            if (!existing) {
                return interaction.reply({ content: 'No member counter is set up for this server.', ephemeral: true });
            }

            const channel = guild.channels.cache.get(existing.channelId);
            if (channel) {
                await channel.delete('Member counter removed by moderator').catch(() => {});
            }

            removeCounter(guild.id);

            return interaction.reply({
                content: '🗑️ Member counter channel removed.',
                ephemeral: true
            });
        }
    }
};
