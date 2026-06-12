const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'Create an informational embed',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('You need the "Manage Messages" permission to use this command.');
        }

        await message.delete().catch(() => {});

        if (args.length === 0) {
            return message.channel.send('Usage: `!info <title> | <description>`\n' +
                'Example: `!info Server Rules | Please follow all community guidelines`');
        }

        const input = args.join(' ');
        const parts = input.split(' | ');

        if (parts.length < 2) {
            return message.channel.send('You need both a title and description!\n' +
                'Usage: `!info <title> | <description>`');
        }

        const title = parts[0];
        const description = parts[1];

        try {
            const embed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setDescription(description)
                .setColor('#3498db') // Blue color for info
                .setTimestamp()
                .setFooter({ 
                    text: 'Section42 Information', 
                    iconURL: message.guild.iconURL() 
                });

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating info embed:', error);
            message.channel.send('Error creating info embed.');
        }
    }
};
