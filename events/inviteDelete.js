const inviteTracker = require('../utils/inviteTracker');

module.exports = {
    name: 'inviteDelete',
    async execute(invite) {
        // Remove from cache when an invite is deleted
        const guildInvites = inviteTracker.inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
            console.log(`🗑️ Invite deleted from cache: ${invite.code}`);
        }
    }
};
