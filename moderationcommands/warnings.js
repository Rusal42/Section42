const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to infractions file
const infractionsPath = path.join(__dirname, '..', 'data', 'infractions.json');

// Helper function to load infractions
function loadInfractions() {
    try {
        if (!fs.existsSync(infractionsPath)) {
            return {};
        }
        const data = fs.readFileSync(infractionsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading infractions:', error);
        return {};
    }
}

module.exports = {
    name: 'warnings',
    description: 'View warnings for a user',
    async execute(message, args) {
        try {
            // Check if user has manage messages permission (moderator+)
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Access Denied')
                    .setDescription('You need **Manage Messages** permission to use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            // Get target user (mention or ID)
            let targetUser = message.mentions.users.first();
            
            // If no mention, try to parse as user ID
            if (!targetUser && args[0]) {
                const userId = args[0].replace(/[<@!>]/g, ''); // Remove mention formatting if present
                try {
                    targetUser = await message.client.users.fetch(userId);
                } catch (error) {
                    // Invalid user ID
                }
            }
            
            if (!targetUser) {
                const usageEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('📋 Command Usage')
                    .setDescription('**Usage:** `!warnings @user` or `!warnings <userID>`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!warnings @user`\n`!warnings 123456789012345678`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            // Load infractions
            const infractions = loadInfractions();
            
            // Check if user has any warnings
            if (!infractions[targetUser.id] || infractions[targetUser.id].warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor('#b6dbd9')
                    .setTitle('✅ Clean Record')
                    .setDescription(`${targetUser.tag} has no warnings on record.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();
                
                return message.reply({ embeds: [noWarningsEmbed] });
            }

            const userWarnings = infractions[targetUser.id].warnings;
            const warningCount = userWarnings.length;

            // Create main embed
            const warningsEmbed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle(`⚠️ Warning History for ${targetUser.tag}`)
                .setDescription(`Total Warnings: **${warningCount}**`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `User ID: ${targetUser.id}`, iconURL: message.guild.iconURL() });

            // Add warning level indicator
            if (warningCount >= 3) {
                warningsEmbed.addFields({
                    name: '🚨 Warning Level',
                    value: '**HIGH RISK** - Consider further action',
                    inline: false
                });
            } else if (warningCount >= 2) {
                warningsEmbed.addFields({
                    name: '⚠️ Warning Level',
                    value: '**MODERATE** - Monitor closely',
                    inline: false
                });
            } else {
                warningsEmbed.addFields({
                    name: '📊 Warning Level',
                    value: '**LOW** - First offense',
                    inline: false
                });
            }

            // Sort warnings by timestamp (newest first)
            const sortedWarnings = userWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Add individual warnings (limit to 10 most recent)
            const displayWarnings = sortedWarnings.slice(0, 10);
            
            displayWarnings.forEach((warning, index) => {
                const date = new Date(warning.timestamp);
                const timeString = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
                
                warningsEmbed.addFields({
                    name: `Warning #${sortedWarnings.length - index} (ID: ${warning.id})`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator.tag}\n**Date:** ${timeString}`,
                    inline: false
                });
            });

            // Add note if there are more warnings than displayed
            if (warningCount > 10) {
                warningsEmbed.addFields({
                    name: '📝 Note',
                    value: `Showing 10 most recent warnings out of ${warningCount} total.`,
                    inline: false
                });
            }

            message.reply({ embeds: [warningsEmbed] });

            console.log(`📋 ${message.author.tag} viewed warnings for ${targetUser.tag} (${warningCount} warnings)`);

        } catch (error) {
            console.error('Error executing warnings command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to retrieve warnings.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
