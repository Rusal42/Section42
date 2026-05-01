const { EmbedBuilder } = require('discord.js');
const { activeGiveaways } = require('../commands/giveaway');
const inviteTracker = require('../utils/inviteTracker');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;
        
        // Check if this is a giveaway message
        const giveaway = activeGiveaways.get(reaction.message.id);
        if (!giveaway) return;
        
        // Check if it's the giveaway reaction emoji
        if (reaction.emoji.name !== '1️⃣') return;
        
        // Check if giveaway requires invites
        if (!giveaway.requiredInvites || giveaway.requiredInvites === 0) return;
        
        // Check user's invite count
        const stats = inviteTracker.getStats(user.id);
        
        if (stats.count < giveaway.requiredInvites) {
            // User doesn't have enough invites
            const needed = giveaway.requiredInvites - stats.count;
            
            try {
                // DM the user
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff6b35')
                    .setTitle('⚠️ Giveaway Entry Issue')
                    .setDescription(
                        `You reacted to the **${giveaway.prize}** giveaway, but you don't have enough invites to win.\n\n` +
                        `**Required:** ${giveaway.requiredInvites} invites\n` +
                        `**You have:** ${stats.count} invites\n` +
                        `**Need:** ${needed} more invite${needed === 1 ? '' : 's'}\n\n` +
                        `Invite your friends to the server and try again!`
                    )
                    .setTimestamp();
                
                await user.send({ embeds: [dmEmbed] });
                
                // Remove their reaction so they know they didn't enter
                await reaction.users.remove(user.id);
                
                console.log(`📨 DM'd ${user.tag} about insufficient invites for giveaway`);
            } catch (error) {
                // User has DMs disabled or other error
                console.log(`Could not DM ${user.tag} about invites: ${error.message}`);
            }
        }
    }
};
