const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(message) {
        const sent = await message.channel.send('Pinging...');
        sent.edit(`Pong! Latency is ${sent.createdTimestamp - message.createdTimestamp}ms.`);
    },
    async executeSlash(interaction) {
        await interaction.reply({ content: 'Pinging...', ephemeral: true });
        const replied = await interaction.fetchReply();
        await interaction.editReply(`Pong! Latency is ${replied.createdTimestamp - interaction.createdTimestamp}ms.`);
    }
};
