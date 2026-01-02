const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'sendroleinfo',
    description: 'Sends comprehensive role information for the server',

    async execute(message) {
        const OWNER_ID = '746068840978448565';

        if (message.author.id !== OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const roleInfoChannel = message.guild.channels.cache.find(channel => channel.name === 'role-info');

        if (!roleInfoChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Channel Not Found')
                .setDescription('Could not find the `role-info` channel. Please make sure it exists.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        await message.delete().catch(() => {});

        const roleInfoEmbed1 = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('Crucifyym\'s Community Roles')
            .setDescription('Learn about our server roles and how to obtain them!\n\n**Note:** All role applications are reviewed manually')
            .addFields(
                {
                    name: '**Content Creator**',
                    value: 'Special permissions for content creators\n• Access to exclusive self-promotion channel\n• Enhanced creator permissions\n• **How to get:** Show your content and make a ticket or DM @Mesmerizing',
                    inline: false
                },
                {
                    name: '**Developer**',
                    value: 'For Section42 game developers\n• Access to collaboration channels\n• Work directly with content creators\n• **How to get:** Show your development skills and make a ticket or DM @Mesmerizing',
                    inline: false
                },
                {
                    name: '**Moderator**',
                    value: 'Community moderation team\n• Moderation permissions\n• Access to staff channels\n• **How to get:** Apply when applications are open or be invited by staff',
                    inline: false
                },
                {
                    name: '**Admin**',
                    value: 'Server administration team\n• Full server management\n• Access to all channels\n• **How to get:** Promoted from Moderator by server owner',
                    inline: false
                },
                {
                    name: '**How to Apply**',
                    value: '• **Make a ticket** using our ticket system\n• **DM the owner** @Mesmerizing directly\n• **Show your work** - provide examples of content/development\n• **Be active** in the community first',
                    inline: false
                }
            )
            .setTimestamp();

        await roleInfoChannel.send({ embeds: [roleInfoEmbed1] });

        const successEmbed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('Role Info Sent!')
            .setDescription('All role information embeds have been posted to the role-info channel!')
            .setTimestamp();

        try {
            await message.author.send({ embeds: [successEmbed] });
        } catch {
            await message.channel.send({ embeds: [successEmbed] });
        }
    }
};
