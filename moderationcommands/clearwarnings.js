const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(__dirname, '..', 'data', 'infractions.json');

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
    name: 'clearwarnings',
    description: 'Clear all warnings for a user (Admin only)',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Administrator** permission to use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            let targetUser = message.mentions.users.first();
            
            if (!targetUser && args[0]) {
                const userId = args[0].replace(/[<@!>]/g, ''); // Remove mention formatting if present
                try {
                    targetUser = await message.client.users.fetch(userId);
                } catch (error) {
                }
            }
            
            if (!targetUser) {
                const usageEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('Command Usage')
                    .setDescription('**Usage:** `!clearwarnings @user [reason]` or `!clearwarnings <userID> [reason]`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!clearwarnings @user Reformed behavior`\n`!clearwarnings 123456789012345678 Reformed behavior`',
                            inline: false
                        },
                        {
                            name: 'Warning',
                            value: 'This action cannot be undone!',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            const infractions = loadInfractions();
            
            if (!infractions[targetUser.id] || infractions[targetUser.id].warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('No Warnings Found')
                    .setDescription(`${targetUser.tag} has no warnings to clear.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();
                
                return message.reply({ embeds: [noWarningsEmbed] });
            }

            const warningCount = infractions[targetUser.id].warnings.length;
            const reason = args.slice(1).join(' ') || 'No reason provided';

            infractions[targetUser.id].warnings = [];
            
            saveInfractions(infractions);

            const successEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('Warnings Cleared')
                .setDescription(`Successfully cleared all warnings for ${targetUser.tag}`)
                .addFields(
                    {
                        name: 'User',
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: true
                    },
                    {
                        name: 'Administrator',
                        value: `${message.author.tag}`,
                        inline: true
                    },
                    {
                        name: 'Warnings Cleared',
                        value: `${warningCount}`,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: reason,
                        inline: false
                    },
                    {
                        name: 'Status',
                        value: 'User now has a clean record',
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Administrative Action', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [successEmbed] });

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#b6dbd9')
                    .setTitle('Warnings Cleared')
                    .setDescription(`Your warnings have been cleared in **${message.guild.name}**`)
                    .addFields(
                        {
                            name: 'Previous Warnings',
                            value: `${warningCount}`,
                            inline: true
                        },
                        {
                            name: 'Current Status',
                            value: 'Clean record',
                            inline: true
                        },
                        {
                            name: 'Reason',
                            value: reason,
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Continue following the rules to maintain your clean record!' });

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Could not DM ${targetUser.tag} about their cleared warnings`);
            }

            console.log(`${message.author.tag} cleared ${warningCount} warnings for ${targetUser.tag}: ${reason}`);

        } catch (error) {
            console.error('Error executing clearwarnings command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while trying to clear warnings.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
