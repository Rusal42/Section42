const { EmbedBuilder } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'listserver',
    description: 'Lists all roles and channels in the server',
    
    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            return;
        }

        const guild = message.guild;

        // Get all roles (excluding @everyone and bot roles)
        const roles = guild.roles.cache
            .filter(role => role.name !== '@everyone' && !role.managed)
            .sort((a, b) => b.position - a.position)
            .map(role => `**${role.name}** - ${role.hexColor} ${role.hoist ? '(Hoisted)' : ''}`)
            .join('\n');

        // Get all categories and their channels
        const categories = guild.channels.cache
            .filter(channel => channel.type === 4) // Category type
            .sort((a, b) => a.position - b.position);

        let channelList = '';
        categories.forEach(category => {
            channelList += `\n**${category.name}**\n`;
            const categoryChannels = guild.channels.cache
                .filter(channel => channel.parentId === category.id)
                .sort((a, b) => a.position - b.position);
            
            categoryChannels.forEach(channel => {
                const channelType = channel.type === 0 ? 'Text' : channel.type === 2 ? 'Voice' : 'Other';
                
                // Get permission overwrites for roles (include @everyone for denies)
                const rolePerms = channel.permissionOverwrites.cache
                    .filter(overwrite => overwrite.type === 0) // Role type
                    .map(overwrite => {
                        const role = guild.roles.cache.get(overwrite.id);
                        if (!role) return null;
                        
                        const allows = [];
                        const denies = [];
                        
                        if (overwrite.allow.has('ViewChannel')) allows.push('View');
                        if (overwrite.allow.has('SendMessages')) allows.push('Send');
                        if (overwrite.deny.has('ViewChannel')) denies.push('NoView');
                        if (overwrite.deny.has('SendMessages')) denies.push('NoSend');
                        
                        // Skip @everyone if it has no denies
                        if (role.name === '@everyone' && denies.length === 0) return null;
                        
                        const perms = [];
                        if (allows.length > 0) perms.push(`+${allows.join(',')}`);
                        if (denies.length > 0) perms.push(`-${denies.join(',')}`);
                        
                        return perms.length > 0 ? `${role.name}[${perms.join(' ')}]` : null;
                    })
                    .filter(p => p !== null);
                
                const permString = rolePerms.length > 0 ? ` | ${rolePerms.join(', ')}` : '';
                channelList += `  • ${channel.name} (${channelType}) [ID: ${channel.id}]${permString}\n`;
            });
            
            if (categoryChannels.size === 0) {
                channelList += '  (No channels)\n';
            }
        });

        // Channels without category
        const noCategory = guild.channels.cache
            .filter(channel => !channel.parentId && channel.type !== 4)
            .sort((a, b) => a.position - b.position);

        if (noCategory.size > 0) {
            channelList += `\n**No Category**\n`;
            noCategory.forEach(channel => {
                const channelType = channel.type === 0 ? 'Text' : channel.type === 2 ? 'Voice' : 'Other';
                
                const rolePerms = channel.permissionOverwrites.cache
                    .filter(overwrite => overwrite.type === 0)
                    .map(overwrite => {
                        const role = guild.roles.cache.get(overwrite.id);
                        if (!role) return null;
                        
                        const allows = [];
                        const denies = [];
                        
                        if (overwrite.allow.has('ViewChannel')) allows.push('View');
                        if (overwrite.allow.has('SendMessages')) allows.push('Send');
                        if (overwrite.deny.has('ViewChannel')) denies.push('NoView');
                        if (overwrite.deny.has('SendMessages')) denies.push('NoSend');
                        
                        // Skip @everyone if it has no denies
                        if (role.name === '@everyone' && denies.length === 0) return null;
                        
                        const perms = [];
                        if (allows.length > 0) perms.push(`+${allows.join(',')}`);
                        if (denies.length > 0) perms.push(`-${denies.join(',')}`);
                        
                        return perms.length > 0 ? `${role.name}[${perms.join(' ')}]` : null;
                    })
                    .filter(p => p !== null);
                
                const permString = rolePerms.length > 0 ? ` | ${rolePerms.join(', ')}` : '';
                channelList += `  • ${channel.name} (${channelType}) [ID: ${channel.id}]${permString}\n`;
            });
        }

        // Split into multiple embeds if needed
        const rolesEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📋 Server Roles')
            .setDescription(roles.length > 0 ? roles.substring(0, 4000) : 'No roles found')
            .setTimestamp();

        const channelsEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📁 Server Channels')
            .setDescription(channelList.length > 0 ? channelList.substring(0, 4000) : 'No channels found')
            .setTimestamp();

        await message.channel.send({ embeds: [rolesEmbed, channelsEmbed] });
    }
};
