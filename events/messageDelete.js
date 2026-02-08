function handleMessageDelete(message, client, ALLOWED_GUILD_IDS) {
    if (!ALLOWED_GUILD_IDS.includes(message.guild.id)) return;
    if (message.author.bot) return;

    const snipeData = {
        content: message.content,
        author: message.author,
        deletedAt: new Date(),
        attachment: message.attachments.first()?.url || null
    };

    client.snipes.set(message.channel.id, snipeData);

    if (!client.snipeList.has(message.channel.id)) {
        client.snipeList.set(message.channel.id, []);
    }

    const channelSnipes = client.snipeList.get(message.channel.id);
    channelSnipes.unshift(snipeData);

    if (channelSnipes.length > 10) {
        channelSnipes.pop();
    }
}

module.exports = {
    handleMessageDelete
};
