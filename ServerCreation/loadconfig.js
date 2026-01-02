const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'loadconfig',
    description: 'Lists available saved configurations or loads a specific one',
    
    async execute(message, args) {
        if (!OWNER_IDS.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const configDir = path.join(__dirname, '..', 'data', 'saved-configs');
        
        if (!fs.existsSync(configDir)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('📭 No Saved Configurations')
                .setDescription('No configurations have been saved yet. Use `!saveconfig` to save your current server setup.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        // If no arguments, list available configs
        if (args.length === 0) {
            const files = fs.readdirSync(configDir)
                .filter(file => file.endsWith('.json') && file !== 'latest.json')
                .sort()
                .reverse();

            if (files.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#e67e22')
                    .setTitle('📭 No Saved Configurations')
                    .setDescription('No configurations have been saved yet. Use `!saveconfig` to save your current server setup.')
                    .setTimestamp();
                return message.channel.send({ embeds: [errorEmbed] });
            }

            const listEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📋 Saved Configurations')
                .setDescription('Available saved configurations:\n\n' + 
                    files.slice(0, 10).map((file, index) => {
                        const filepath = path.join(configDir, file);
                        const config = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                        const date = new Date(config.savedAt).toLocaleString();
                        return `**${index + 1}.** \`${file}\`\n   Saved: ${date}\n   Roles: ${config.roles.length} | Categories: ${config.categories.length}`;
                    }).join('\n\n'))
                .addFields({
                    name: '💡 How to Load',
                    value: '• `!loadconfig latest` - Load the most recent configuration\n• `!loadconfig <filename>` - Load a specific configuration file\n• `!loadconfig view <filename>` - View configuration details without loading',
                    inline: false
                })
                .setTimestamp();

            return message.channel.send({ embeds: [listEmbed] });
        }

        // View configuration details
        if (args[0] === 'view' && args[1]) {
            const filename = args[1] === 'latest' ? 'latest.json' : args[1];
            const filepath = path.join(configDir, filename);

            if (!fs.existsSync(filepath)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Configuration Not Found')
                    .setDescription(`Configuration file \`${filename}\` does not exist.`)
                    .setTimestamp();
                return message.channel.send({ embeds: [errorEmbed] });
            }

            const config = JSON.parse(fs.readFileSync(filepath, 'utf8'));

            const viewEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`📄 Configuration: ${filename}`)
                .setDescription(`Saved from: **${config.guildName}**\nSaved at: ${new Date(config.savedAt).toLocaleString()}`)
                .addFields(
                    { name: '🏷️ Roles', value: `${config.roles.length} roles\n${config.roles.slice(0, 5).map(r => `• ${r.name}`).join('\n')}${config.roles.length > 5 ? `\n...and ${config.roles.length - 5} more` : ''}`, inline: true },
                    { name: '📂 Categories', value: `${config.categories.length} categories\n${config.categories.slice(0, 5).map(c => `• ${c.name}`).join('\n')}${config.categories.length > 5 ? `\n...and ${config.categories.length - 5} more` : ''}`, inline: true },
                    { name: '📝 Channels', value: `${config.categories.reduce((sum, cat) => sum + cat.channels.length, 0) + config.channels.length} total channels`, inline: true }
                )
                .setTimestamp();

            return message.channel.send({ embeds: [viewEmbed] });
        }

        // Load configuration (placeholder - would need careful implementation)
        const filename = args[0] === 'latest' ? 'latest.json' : args[0];
        const filepath = path.join(configDir, filename);

        if (!fs.existsSync(filepath)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Configuration Not Found')
                .setDescription(`Configuration file \`${filename}\` does not exist.`)
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const infoEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('ℹ️ Configuration Reference')
            .setDescription(`Configuration \`${filename}\` is available for reference.\n\nYou can view its details with \`!loadconfig view ${filename}\`\n\nTo apply similar settings, use \`!servupdate\` to update your server based on the hardcoded configuration in \`servupdate.js\`.`)
            .addFields({
                name: '💡 Tip',
                value: 'Saved configurations serve as backups and references. You can manually compare them with your current setup using `!listserver`.',
                inline: false
            })
            .setTimestamp();

        await message.channel.send({ embeds: [infoEmbed] });
    }
};
