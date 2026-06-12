const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'embed',
    description: 'Create a custom embed message',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('You need the "Manage Messages" permission to use this command.');
        }

        await message.delete().catch(() => {});

        if (args.length === 0) {
            return message.channel.send('Usage: `!embed <title> | <description> | [color] | [footer]`\n' +
                'Example: `!embed Welcome! | Welcome to our server | #ff6b35 | Section42 Team`');
        }

        const input = args.join(' ');
        const parts = input.split(' | ');

        if (parts.length < 2) {
            return message.channel.send('You need at least a title and description!\n' +
                'Usage: `!embed <title> | <description> | [color] | [footer]`');
        }

        const title = parts[0];
        const description = parts[1];
        const color = parts[2] || '#ff6b35'; // Default Section42 color
        const footer = parts[3] || null;

        try {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();

            if (footer) {
                embed.setFooter({ text: footer, iconURL: message.guild.iconURL() });
            }

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating embed:', error);
            message.channel.send('Error creating embed. Make sure your color is valid (e.g., #ff6b35).');
        }
    }
};
