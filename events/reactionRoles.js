const messageTracker = require('../utils/messageTracker');

// Reaction role mappings
const reactionRoleMap = {
    // Gender roles (using different emojis to avoid conflicts)
    '♂️': 'Male',
    '♀️': 'Female',
    // Color roles
    '🔴': 'Red',
    '🟠': 'Orange',
    '🟡': 'Yellow',
    '🟢': 'Green',
    '🔵': 'Blue',
    '🟣': 'Purple',
    '🩷': 'Pink',
    '⚪': 'White',
    '⚫': 'Black'
};

const colorRoles = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'White', 'Black'];

async function handleReactionAdd(reaction, user, ALLOWED_GUILD_IDS) {
    if (user.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(reaction.message.guild.id)) return;

    // Fetch partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const emoji = reaction.emoji.name;
    const roleName = reactionRoleMap[emoji];

    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    try {
        // If it's a color role, remove all other color roles first
        if (colorRoles.includes(roleName)) {
            const memberColorRoles = member.roles.cache.filter(r => colorRoles.includes(r.name));
            for (const [, colorRole] of memberColorRoles) {
                await member.roles.remove(colorRole);
            }
        }

        await member.roles.add(role);
        console.log(`Added ${roleName} role to ${user.tag}`);
    } catch (error) {
        console.error(`Error adding role ${roleName} to ${user.tag}:`, error);
    }
}

async function handleReactionRemove(reaction, user, ALLOWED_GUILD_IDS) {
    if (user.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(reaction.message.guild.id)) return;

    // Fetch partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const emoji = reaction.emoji.name;
    const roleName = reactionRoleMap[emoji];

    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    try {
        await member.roles.remove(role);
        console.log(`Removed ${roleName} role from ${user.tag}`);
    } catch (error) {
        console.error(`Error removing role ${roleName} from ${user.tag}:`, error);
    }
}

async function restoreReactionRoles(client, ALLOWED_GUILD_IDS) {
    console.log('🔄 Checking for reaction role messages to restore...');
    for (const guildId of ALLOWED_GUILD_IDS) {
        try {
            const guild = await client.guilds.fetch(guildId);
            const trackedMessages = messageTracker.getAllMessages(guildId);
            
            // Check for reaction role messages
            const reactionRoleTypes = ['reaction_roles_gender', 'reaction_roles_color'];
            
            for (const messageType of reactionRoleTypes) {
                if (trackedMessages[messageType]) {
                    const { channelId, messageId } = trackedMessages[messageType];
                    
                    try {
                        const channel = await guild.channels.fetch(channelId);
                        const message = await channel.messages.fetch(messageId);
                        
                        // Process all reactions on this message
                        for (const [emoji, reaction] of message.reactions.cache) {
                            const roleName = reactionRoleMap[emoji];
                            if (!roleName) continue;
                            
                            const role = guild.roles.cache.find(r => r.name === roleName);
                            if (!role) continue;
                            
                            // Fetch all users who reacted
                            const users = await reaction.users.fetch();
                            
                            for (const [userId, user] of users) {
                                if (user.bot) continue;
                                
                                try {
                                    const member = await guild.members.fetch(userId);
                                    
                                    // Check if member already has the role
                                    if (!member.roles.cache.has(role.id)) {
                                        // If it's a color role, remove other color roles first
                                        if (colorRoles.includes(roleName)) {
                                            const memberColorRoles = member.roles.cache.filter(r => colorRoles.includes(r.name));
                                            for (const [, colorRole] of memberColorRoles) {
                                                await member.roles.remove(colorRole);
                                            }
                                        }
                                        
                                        await member.roles.add(role);
                                        console.log(`✅ Restored ${roleName} role to ${user.tag}`);
                                    }
                                } catch (error) {
                                    console.error(`Error restoring role for ${user.tag}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching message ${messageType}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing guild ${guildId}:`, error);
        }
    }
    console.log('✅ Reaction role restoration complete!');
}

module.exports = {
    handleReactionAdd,
    handleReactionRemove,
    restoreReactionRoles,
    reactionRoleMap,
    colorRoles
};
