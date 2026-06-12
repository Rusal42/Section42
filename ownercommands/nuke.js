const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'nuke',
    description: 'Completely wipes this channel and recreates it',
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Completely wipes this channel and recreates it'),

    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Bot Permission Required')
                .setDescription('I need the **Manage Channels** permission to nuke this channel.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const channel = message.channel;

        const confirmEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Channel Nuke')
            .setDescription('This will delete this channel and all of its messages and recreate it.\n\nType `confirm` to continue or anything else to cancel.')
            .setTimestamp();

        const confirmMsg = await channel.send({ embeds: [confirmEmbed] });

        const filter = (m) => m.author.id === message.author.id;

        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const reply = collected.first();

            if (!reply || reply.content.toLowerCase() !== 'confirm') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Nuke Cancelled')
                    .setDescription('Channel nuke operation has been cancelled.')
                    .setTimestamp();
                await channel.send({ embeds: [cancelEmbed] });
                return;
            }

            await message.delete().catch(() => {});
            await reply.delete().catch(() => {});
            await confirmMsg.delete().catch(() => {});

            const position = channel.position;
            const parent = channel.parent;
            const topic = channel.topic;
            const nsfw = channel.nsfw;
            const rateLimitPerUser = channel.rateLimitPerUser;

            const nukingEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('Nuking Channel')
                .setDescription('This channel is being nuked...')
                .setTimestamp();

            const nukingMsg = await channel.send({ embeds: [nukingEmbed] });

            const newChannel = await channel.clone({ 
                name: 'Crucifyym crator',
                reason: `Channel nuked by ${message.author.tag}` 
            });

            if (parent) {
                await newChannel.setParent(parent.id, { lockPermissions: true }).catch(() => {});
            }

            await newChannel.setPosition(position).catch(() => {});
            await newChannel.setTopic(topic || null).catch(() => {});
            await newChannel.setNSFW(nsfw).catch(() => {});
            await newChannel.setRateLimitPerUser(rateLimitPerUser).catch(() => {});

            await channel.delete('Channel nuked').catch(() => {});

            await newChannel.send('nuked by crucifyym dm for promoation and commisons');

        } catch (error) {
            if (error instanceof Map || (error && error.code === 'time')) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Nuke Timed Out')
                    .setDescription('No confirmation received. Channel nuke cancelled.')
                    .setTimestamp();
                await channel.send({ embeds: [timeoutEmbed] }).catch(() => {});
                return;
            }

            console.error('Error nuking channel:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nuke Failed')
                .setDescription('An error occurred while nuking this channel.')
                .setTimestamp();
            await message.channel.send({ embeds: [errorEmbed] });
        }
    },

    async executeSlash(interaction) {
        if (!OWNER_IDS.includes(interaction.user.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Bot Permission Required')
                .setDescription('I need the **Manage Channels** permission to nuke this channel.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const channel = interaction.channel;

        const confirmEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Channel Nuke')
            .setDescription('This will delete this channel and all of its messages and recreate it.\n\nType `confirm` in this channel to continue or anything else to cancel.')
            .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: false });

        const filter = (m) => m.author.id === interaction.user.id;

        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const reply = collected.first();

            if (!reply || reply.content.toLowerCase() !== 'confirm') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Nuke Cancelled')
                    .setDescription('Channel nuke operation has been cancelled.')
                    .setTimestamp();
                await channel.send({ embeds: [cancelEmbed] });
                return;
            }

            await reply.delete().catch(() => {});

            const position = channel.position;
            const parent = channel.parent;
            const topic = channel.topic;
            const nsfw = channel.nsfw;
            const rateLimitPerUser = channel.rateLimitPerUser;

            const nukingEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('Nuking Channel')
                .setDescription('This channel is being nuked...')
                .setTimestamp();

            await channel.send({ embeds: [nukingEmbed] });

            const newChannel = await channel.clone({ 
                name: 'Crucifyym crator',
                reason: `Channel nuked by ${interaction.user.tag}` 
            });

            if (parent) {
                await newChannel.setParent(parent.id, { lockPermissions: true }).catch(() => {});
            }

            await newChannel.setPosition(position).catch(() => {});
            await newChannel.setTopic(topic || null).catch(() => {});
            await newChannel.setNSFW(nsfw).catch(() => {});
            await newChannel.setRateLimitPerUser(rateLimitPerUser).catch(() => {});

            await channel.delete('Channel nuked').catch(() => {});

            await newChannel.send('nuked by crucifyym dm for promoation and commisons');

        } catch (error) {
            if (error instanceof Map || (error && error.code === 'time')) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Nuke Timed Out')
                    .setDescription('No confirmation received. Channel nuke cancelled.')
                    .setTimestamp();
                await channel.send({ embeds: [timeoutEmbed] }).catch(() => {});
                return;
            }

            console.error('Error nuking channel (slash):', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nuke Failed')
                .setDescription('An error occurred while nuking this channel.')
                .setTimestamp();
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            }
        }
    }
};
