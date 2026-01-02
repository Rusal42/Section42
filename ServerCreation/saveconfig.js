const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'saveconfig',
    description: 'Saves the current server configuration (roles, channels, permissions) to a JSON file',
    
    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const savingEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('💾 Saving Server Configuration')
            .setDescription('Capturing current server state...')
            .setTimestamp();
        
        const statusMessage = await message.channel.send({ embeds: [savingEmbed] });

        try {
            const guild = message.guild;
            const config = {
                savedAt: new Date().toISOString(),
                guildId: guild.id,
                guildName: guild.name,
                roles: [],
                categories: [],
                channels: []
            };

            // Save all roles (excluding @everyone and managed roles)
            const roles = guild.roles.cache
                .filter(role => role.name !== '@everyone' && !role.managed)
                .sort((a, b) => b.position - a.position);

            for (const [, role] of roles) {
                config.roles.push({
                    name: role.name,
                    color: role.hexColor,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    position: role.position,
                    permissions: role.permissions.toArray()
                });
            }

            // Save all categories and channels with permissions
            const categories = guild.channels.cache
                .filter(channel => channel.type === 4) // Category type
                .sort((a, b) => a.position - b.position);

            for (const [, category] of categories) {
                const categoryData = {
                    name: category.name,
                    position: category.position,
                    channels: []
                };

                // Get channels in this category
                const categoryChannels = guild.channels.cache
                    .filter(channel => channel.parentId === category.id)
                    .sort((a, b) => a.position - b.position);

                for (const [, channel] of categoryChannels) {
                    const channelData = {
                        name: channel.name,
                        type: channel.type === 0 ? 'text' : channel.type === 2 ? 'voice' : 'other',
                        position: channel.position,
                        topic: channel.topic || '',
                        permissionOverwrites: []
                    };

                    // Save permission overwrites
                    for (const [, overwrite] of channel.permissionOverwrites.cache) {
                        if (overwrite.type === 0) { // Role type
                            const role = guild.roles.cache.get(overwrite.id);
                            if (role) {
                                channelData.permissionOverwrites.push({
                                    roleName: role.name,
                                    allow: overwrite.allow.toArray(),
                                    deny: overwrite.deny.toArray()
                                });
                            }
                        }
                    }

                    categoryData.channels.push(channelData);
                }

                config.categories.push(categoryData);
            }

            // Save channels without category
            const noCategory = guild.channels.cache
                .filter(channel => !channel.parentId && channel.type !== 4)
                .sort((a, b) => a.position - b.position);

            for (const [, channel] of noCategory) {
                const channelData = {
                    name: channel.name,
                    type: channel.type === 0 ? 'text' : channel.type === 2 ? 'voice' : 'other',
                    position: channel.position,
                    topic: channel.topic || '',
                    category: null,
                    permissionOverwrites: []
                };

                // Save permission overwrites
                for (const [, overwrite] of channel.permissionOverwrites.cache) {
                    if (overwrite.type === 0) { // Role type
                        const role = guild.roles.cache.get(overwrite.id);
                        if (role) {
                            channelData.permissionOverwrites.push({
                                roleName: role.name,
                                allow: overwrite.allow.toArray(),
                                deny: overwrite.deny.toArray()
                            });
                        }
                    }
                }

                config.channels.push(channelData);
            }

            // Save to file
            const configDir = path.join(__dirname, '..', 'data', 'saved-configs');
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `server-config-${timestamp}.json`;
            const filepath = path.join(configDir, filename);

            fs.writeFileSync(filepath, JSON.stringify(config, null, 2));

            // Also save as "latest" for easy access
            const latestPath = path.join(configDir, 'latest.json');
            fs.writeFileSync(latestPath, JSON.stringify(config, null, 2));

            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Configuration Saved!')
                .setDescription(`Server configuration has been saved successfully!`)
                .addFields(
                    { name: '📁 Filename', value: filename, inline: false },
                    { name: '🏷️ Roles Saved', value: `${config.roles.length} roles`, inline: true },
                    { name: '📂 Categories', value: `${config.categories.length} categories`, inline: true },
                    { name: '📝 Total Channels', value: `${config.categories.reduce((sum, cat) => sum + cat.channels.length, 0) + config.channels.length} channels`, inline: true },
                    { name: '💡 Tip', value: 'You can use this saved configuration as a reference or restore it later using `!loadconfig`', inline: false }
                )
                .setTimestamp();

            await statusMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error saving configuration:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error Saving Configuration')
                .setDescription(`An error occurred while saving the configuration:\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            await statusMessage.edit({ embeds: [errorEmbed] });
        }
    }
};
