const fs = require('fs');
const path = require('path');

const INVITE_DATA_PATH = path.join(__dirname, '..', 'data', 'invites.json');

class InviteTracker {
    constructor() {
        this.inviteCache = new Map(); // guildId -> Map of invite codes -> uses
        this.inviteData = this.loadData(); // inviterId -> { invites: count, users: [userIds] }
    }

    loadData() {
        try {
            if (fs.existsSync(INVITE_DATA_PATH)) {
                const data = JSON.parse(fs.readFileSync(INVITE_DATA_PATH, 'utf8'));
                // Convert back to expected format
                return data;
            }
        } catch (error) {
            console.error('Error loading invite data:', error);
        }
        return {};
    }

    saveData() {
        try {
            const dataDir = path.dirname(INVITE_DATA_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(INVITE_DATA_PATH, JSON.stringify(this.inviteData, null, 2));
        } catch (error) {
            console.error('Error saving invite data:', error);
        }
    }

    // Cache all invites for a guild
    async cacheGuildInvites(guild) {
        try {
            const invites = await guild.invites.fetch();
            const guildInvites = new Map();
            
            for (const [code, invite] of invites) {
                guildInvites.set(code, {
                    uses: invite.uses,
                    inviterId: invite.inviter?.id,
                    channelId: invite.channelId
                });
            }
            
            this.inviteCache.set(guild.id, guildInvites);
            console.log(`📨 Cached ${invites.size} invites for ${guild.name}`);
        } catch (error) {
            console.error(`Error caching invites for ${guild.name}:`, error.message);
        }
    }

    // Find which invite was used when someone joined
    async findUsedInvite(guild) {
        try {
            const oldInvites = this.inviteCache.get(guild.id);
            if (!oldInvites) return null;

            const newInvites = await guild.invites.fetch();
            
            for (const [code, newInvite] of newInvites) {
                const oldInvite = oldInvites.get(code);
                
                if (oldInvite && newInvite.uses > oldInvite.uses) {
                    // This invite was used!
                    return {
                        code,
                        inviterId: newInvite.inviter?.id,
                        inviterTag: newInvite.inviter?.tag,
                        uses: newInvite.uses
                    };
                }
                
                // If old invite doesn't exist but new one does with 1 use, it might be new
                if (!oldInvite && newInvite.uses === 1) {
                    return {
                        code,
                        inviterId: newInvite.inviter?.id,
                        inviterTag: newInvite.inviter?.tag,
                        uses: 1
                    };
                }
            }
            
            // Update cache
            const updatedInvites = new Map();
            for (const [code, invite] of newInvites) {
                updatedInvites.set(code, {
                    uses: invite.uses,
                    inviterId: invite.inviter?.id,
                    channelId: invite.channelId
                });
            }
            this.inviteCache.set(guild.id, updatedInvites);
            
            return null;
        } catch (error) {
            console.error('Error finding used invite:', error);
            return null;
        }
    }

    // Track an invite
    trackInvite(inviterId, invitedUserId) {
        if (!this.inviteData[inviterId]) {
            this.inviteData[inviterId] = {
                count: 0,
                users: []
            };
        }
        
        this.inviteData[inviterId].count++;
        this.inviteData[inviterId].users.push({
            userId: invitedUserId,
            date: new Date().toISOString()
        });
        
        // Keep only last 100 users per inviter to save space
        if (this.inviteData[inviterId].users.length > 100) {
            this.inviteData[inviterId].users = this.inviteData[inviterId].users.slice(-100);
        }
        
        this.saveData();
    }

    // Get invite stats for a user
    getStats(userId) {
        return this.inviteData[userId] || { count: 0, users: [] };
    }

    // Get leaderboard
    getLeaderboard(guild, limit = 10) {
        const stats = Object.entries(this.inviteData)
            .map(([userId, data]) => ({
                userId,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        
        return stats;
    }
}

module.exports = new InviteTracker();
