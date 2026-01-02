const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('You need the "Manage Messages" permission to use this command.');
        }

        await message.delete().catch(() => {});

        if (args.length === 0) {
            return message.channel.send('Usage: `!say <message>`\n' +
                'Example: `!say Welcome to Section42!`');
        }

        const messageToSend = args.join(' ');

        try {
            await message.channel.send(messageToSend);
        } catch (error) {
            console.error('Error sending message:', error);
            message.channel.send('Error sending message.');
        }
    },
    async executeSlash(interaction) {
        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: 'You need the "Manage Messages" permission to use this command.', ephemeral: true });
        }

        const messageToSend = interaction.options.getString('message');

        try {
            await interaction.reply({ content: 'Message sent!', ephemeral: true });
            await interaction.channel.send(messageToSend);
        } catch (error) {
            console.error('Error sending message:', error);
            await interaction.editReply({ content: 'Error sending message.' });
        }
    }
};
