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

// Helper function to save infractions
function saveInfractions(infractions) {
    try {
        const dataDir = path.dirname(infractionsPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(infractionsPath, JSON.stringify(infractions, null, 2));
    } catch (error) {
        console.error('Error saving infractions:', error);
    }
}

module.exports = {
    name: 'warn',
    description: 'Issue a warning to a user',
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
                    .setDescription('**Usage:** `!warn @user <reason>` or `!warn <userID> <reason>`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!warn @user Please follow the rules`\n`!warn 123456789012345678 Please follow the rules`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            // Get the reason
            const reason = args.slice(1).join(' ');
            if (!reason) {
                const noReasonEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Missing Reason')
                    .setDescription('Please provide a reason for the warning.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noReasonEmbed] });
            }

            // Get the member object
            const targetMember = message.guild.members.cache.get(targetUser.id);
            if (!targetMember) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ User Not Found')
                    .setDescription('That user is not in this server.')
                    .setTimestamp();
                
                return message.reply({ embeds: [notFoundEmbed] });
            }

            // Load current infractions
            const infractions = loadInfractions();
            
            // Initialize user infractions if they don't exist
            if (!infractions[targetUser.id]) {
                infractions[targetUser.id] = {
                    username: targetUser.tag,
                    warnings: []
                };
            }

            // Create warning object
            const warning = {
                id: Date.now().toString(), // Unique ID based on timestamp
                reason: reason,
                moderator: {
                    id: message.author.id,
                    tag: message.author.tag
                },
                timestamp: new Date().toISOString(),
                guildId: message.guild.id
            };

            // Add warning to user's record
            infractions[targetUser.id].warnings.push(warning);
            infractions[targetUser.id].username = targetUser.tag; // Update username in case it changed

            // Save infractions
            saveInfractions(infractions);

            // Get warning count
            const warningCount = infractions[targetUser.id].warnings.length;

            // Send success message
            const successEmbed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('⚠️ Warning Issued')
                .setDescription(`Successfully warned ${targetUser.tag}`)
                .addFields(
                    {
                        name: '👤 Warned User',
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value: `${message.author.tag}`,
                        inline: true
                    },
                    {
                        name: '📊 Total Warnings',
                        value: `${warningCount}`,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason,
                        inline: false
                    },
                    {
                        name: '🆔 Warning ID',
                        value: warning.id,
                        inline: true
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Moderation Action', iconURL: message.guild.iconURL() });

            // Add warning level indicator
            if (warningCount >= 3) {
                successEmbed.addFields({
                    name: '🚨 Warning Level',
                    value: `**HIGH RISK** - This user has ${warningCount} warnings!`,
                    inline: false
                });
            } else if (warningCount >= 2) {
                successEmbed.addFields({
                    name: '⚠️ Warning Level',
                    value: `**MODERATE** - This user has ${warningCount} warnings.`,
                    inline: false
                });
            }

            message.reply({ embeds: [successEmbed] });

            // Try to DM the user about their warning
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('⚠️ You Have Been Warned')
                    .setDescription(`You have received a warning in **${message.guild.name}**`)
                    .addFields(
                        {
                            name: '📝 Reason',
                            value: reason,
                            inline: false
                        },
                        {
                            name: '👮 Moderator',
                            value: message.author.tag,
                            inline: true
                        },
                        {
                            name: '📊 Your Total Warnings',
                            value: `${warningCount}`,
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Please follow the server rules to avoid further action.' });

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled or blocked the bot
                console.log(`Could not DM ${targetUser.tag} about their warning`);
            }

            console.log(`⚠️ ${message.author.tag} warned ${targetUser.tag} (${warningCount} total warnings): ${reason}`);

        } catch (error) {
            console.error('Error executing warn command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to warn the user.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
