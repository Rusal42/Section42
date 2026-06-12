const { getCounter } = require('../utils/memberCounterStore');

async function updateCounter(guild) {
    const entry = getCounter(guild.id);
    if (!entry) return;

    try {
        const channel = await guild.channels.fetch(entry.channelId).catch(() => null);
        if (!channel) return;

        const count = guild.memberCount;
        const newName = entry.format.replace('{count}', count);

        if (channel.name !== newName) {
            await channel.setName(newName);
        }
    } catch (error) {
        console.error(`[MemberCounter] Failed to update counter for guild ${guild.id}:`, error);
    }
}

module.exports = [
    {
        name: 'guildMemberAdd',
        async execute(member) {
            await updateCounter(member.guild);
        }
    },
    {
        name: 'guildMemberRemove',
        async execute(member) {
            await updateCounter(member.guild);
        }
    }
];
