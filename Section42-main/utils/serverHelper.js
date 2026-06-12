const serverConfig = require('../config/serverConfig');

module.exports = {
    getRole(guild, roleName) {
        return guild.roles.cache.find(role => role.name === roleName);
    },
    
    getChannel(guild, channelName) {
        return guild.channels.cache.find(channel => channel.name === channelName);
    },
    
    hasRole(member, roleName) {
        const role = this.getRole(member.guild, roleName);
        return role && member.roles.cache.has(role.id);
    },
    
    hasAnyRole(member, roleNames) {
        return roleNames.some(roleName => this.hasRole(member, roleName));
    },
    
    isStaff(member) {
        return this.hasAnyRole(member, [
            serverConfig.ROLES.ADMIN,
            serverConfig.ROLES.MODERATOR
        ]);
    },
    
    isContentCreator(member) {
        return this.hasRole(member, serverConfig.ROLES.CONTENT_CREATOR);
    },
    
    isDeveloper(member) {
        return this.hasRole(member, serverConfig.ROLES.DEVELOPER);
    },
    
    isFriend(member) {
        return this.hasRole(member, serverConfig.ROLES.FRIENDS);
    },
    
    getAllChannels(guild) {
        const channels = {};
        Object.entries(serverConfig.CHANNELS).forEach(([key, value]) => {
            channels[key] = value.channels.map(name => 
                this.getChannel(guild, name)
            ).filter(ch => ch !== undefined);
        });
        return channels;
    },
    
    getAllRoles(guild) {
        const roles = {};
        Object.entries(serverConfig.ROLES).forEach(([key, value]) => {
            if (typeof value === 'string') {
                roles[key] = this.getRole(guild, value);
            }
        });
        return roles;
    },
    
    getChannelsByCategory(guild, categoryName) {
        const categoryData = Object.values(serverConfig.CHANNELS).find(
            cat => cat.category === categoryName
        );
        if (!categoryData) return [];
        
        return categoryData.channels.map(name => 
            this.getChannel(guild, name)
        ).filter(ch => ch !== undefined);
    },
    
    getRoleInfo(roleName) {
        return serverConfig.ROLE_PERMISSIONS[roleName] || null;
    },
    
    getSocialLinks() {
        return serverConfig.SOCIAL_LINKS;
    },
    
    config: serverConfig
};
