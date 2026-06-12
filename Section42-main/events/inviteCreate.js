const inviteTracker = require('../utils/inviteTracker');

module.exports = {
    name: 'inviteCreate',
    async execute(invite) {
        // Update cache when a new invite is created
        const guildInvites = inviteTracker.inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, {
                uses: invite.uses || 0,
                inviterId: invite.inviter?.id,
                channelId: invite.channelId
            });
            console.log(`📨 New invite cached: ${invite.code} by ${invite.inviter?.tag || 'Unknown'}`);
        }
    }
};
