module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    async execute(message) {
        const sent = await message.channel.send('Pinging...');
        sent.edit(`Pong! Latency is ${sent.createdTimestamp - message.createdTimestamp}ms.`);
    }
};
