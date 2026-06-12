module.exports = {
    SERVER_ID: '1421592736221626572',
    
    ROLES: {
        CRUCIFYYM: 'Crucifyym',
        CONTENT_CREATOR: 'Content Creator',
        DEVELOPER: 'Developer',
        MODERATOR: 'Moderator',
        ADMIN: 'Admin',
        ANNOUNCEMENTS: 'Announcements',
        REVIVE: 'Revive',
        MEMBER: 'Member',
        FRIENDS: 'Friends',
        PIC_PERMS: 'Pic Perms',
        PIC_MUTED: 'Pic Muted',
        BOTS: 'Bots',
        
        GAME_ROLES: [
            'TYPE://SOUL',
            'Deepwoken',
            'ABA',
            'Balthazar',
            'ZO',
            'SoulShatterers',
            'Mortem Metallum',
            'Violence District',
            'Project Power',
            'Fisch',
            'Grow a Garden',
            'JJS',
            'Horse Life',
            'Bee Swarm',
            'DHRP',
            'Other Social Games'
        ]
    },
    
    CATEGORIES: {
        WELCOME: 'WELCOME',
        ANNOUNCEMENTS: 'ANNOUNCEMENTS',
        GAME_DEVELOPMENT: 'GAME DEVELOPMENT',
        COMMUNITY: 'COMMUNITY',
        CONTENT_CREATORS: 'CONTENT CREATORS',
        MEDIA_SHOWCASES: 'MEDIA & SHOWCASES',
        FRIENDS_NETWORK: 'FRIENDS & NETWORK',
        VOICE_CHANNELS: 'VOICE CHANNELS',
        STAFF_MODERATION: 'STAFF & MODERATION',
        SUPPORT_TICKETS: 'SUPPORT TICKETS'
    },
    
    CHANNELS: {
        WELCOME: {
            category: 'WELCOME',
            channels: ['welcome', 'rules', 'server-info']
        },
        ANNOUNCEMENTS: {
            category: 'ANNOUNCEMENTS',
            channels: ['announcements', 'updates', 'role-info']
        },
        GAME_DEVELOPMENT: {
            category: 'GAME DEVELOPMENT',
            channels: ['game-ideas', 'game-concepts', 'development-updates', 'collaboration']
        },
        COMMUNITY: {
            category: 'COMMUNITY',
            channels: ['general-chat', 'bot-commands', 'events']
        },
        CONTENT_CREATORS: {
            category: 'CONTENT CREATORS',
            channels: ['creator-showcase', 'self-promotion', 'collaborations', 'promo-requests']
        },
        MEDIA_SHOWCASES: {
            category: 'MEDIA & SHOWCASES',
            channels: ['screenshots', 'clips', 'fan-art', 'achievements']
        },
        FRIENDS_NETWORK: {
            category: 'FRIENDS & NETWORK',
            channels: ['friends-chat', 'friends-showcase']
        },
        VOICE_CHANNELS: {
            category: 'VOICE CHANNELS',
            channels: ['General Chat', 'Section42 Gaming', 'Content Creation', 'Live Streaming', 'AFK']
        },
        STAFF_MODERATION: {
            category: 'STAFF & MODERATION',
            channels: ['staff-chat', 'mod-logs', 'analytics']
        },
        SUPPORT_TICKETS: {
            category: 'SUPPORT TICKETS',
            channels: ['create-ticket', 'ticket-logs']
        }
    },
    
    ROLE_PERMISSIONS: {
        CONTENT_CREATOR: {
            description: 'Special permissions for content creators',
            access: ['self-promotion', 'creator-showcase', 'collaborations', 'collaboration', 'screenshots', 'clips', 'fan-art', 'achievements'],
            color: '#e74c3c'
        },
        DEVELOPER: {
            description: 'For Section42 game developers',
            access: ['game-ideas', 'game-concepts', 'development-updates', 'collaboration'],
            color: '#9b59b6'
        },
        MODERATOR: {
            description: 'Community moderation team',
            access: ['staff-chat', 'mod-logs', 'analytics'],
            permissions: ['ManageMessages', 'ModerateMembers', 'KickMembers', 'ViewAuditLog'],
            color: '#f39c12'
        },
        ADMIN: {
            description: 'Server administration team',
            access: 'all',
            color: '#27ae60'
        },
        FRIENDS: {
            description: 'For close friends and network members',
            access: ['friends-chat', 'friends-showcase'],
            color: '#3498db'
        }
    },
    
    SOCIAL_LINKS: {
        ROBLOX_GROUP: 'https://www.roblox.com/communities/6957007/Section42#!/about',
        ROBLOX_PROFILE: 'https://www.roblox.com/users/489110745/profile',
        YOUTUBE: 'https://www.youtube.com/@crucifyym',
        TWITCH: 'https://www.twitch.tv/crucifyym',
        TIKTOK: 'https://www.tiktok.com/@crucifyym',
        SOUNDCLOUD: 'https://soundcloud.com/rusal-42',
        BANDLAB: 'https://www.bandlab.com/crucifyym',
        EMAIL: 'crucifyym@gmail.com'
    },
    
    getRole(guild, roleName) {
        return guild.roles.cache.find(role => role.name === roleName);
    },
    
    getChannel(guild, channelName) {
        return guild.channels.cache.find(channel => channel.name === channelName);
    },
    
    getAllChannelNames() {
        const allChannels = [];
        Object.values(this.CHANNELS).forEach(category => {
            allChannels.push(...category.channels);
        });
        return allChannels;
    },
    
    getAllRoleNames() {
        const roles = Object.values(this.ROLES).filter(role => typeof role === 'string');
        return [...roles, ...this.ROLES.GAME_ROLES];
    }
};
