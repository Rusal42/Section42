const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'whois',
    description: 'Display detailed information about a user',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Manage Messages** permission to use this command.')
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
                    .setDescription('**Usage:** `!whois @user` or `!whois <userID>`')
                    .addFields(
                        {
                            name: 'Examples',
                            value: '`!whois @user`\n`!whois 123456789012345678`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [usageEmbed] });
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);

            const accountCreated = targetUser.createdAt;
            const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

            const whoisEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle(`User Information: ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    {
                        name: 'Basic Info',
                        value: `**Username:** ${targetUser.username}\n**Discriminator:** #${targetUser.discriminator}\n**User ID:** ${targetUser.id}`,
                        inline: true
                    },
                    {
                        name: 'Account Created',
                        value: `<t:${Math.floor(accountCreated.getTime() / 1000)}:F>\n*${accountAge} days ago*`,
                        inline: true
                    },
                    {
                        name: 'Account Type',
                        value: targetUser.bot ? 'Bot Account' : 'User Account',
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            if (targetMember) {
                const joinedAt = targetMember.joinedAt;
                const joinAge = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));
                
                const roles = targetMember.roles.cache
                    .filter(role => role.id !== message.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString())
                    .slice(0, 10); // Limit to 10 roles to avoid embed limits

                const roleDisplay = roles.length > 0 ? roles.join(', ') : 'No roles';
                const moreRoles = targetMember.roles.cache.size - 1 > 10 ? `\n*+${targetMember.roles.cache.size - 1 - 10} more roles*` : '';

                whoisEmbed.addFields(
                    {
                        name: 'Joined Server',
                        value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:F>\n*${joinAge} days ago*`,
                        inline: true
                    },
                    {
                        name: 'Server Stats',
                        value: `**Roles:** ${targetMember.roles.cache.size - 1}\n**Highest Role:** ${targetMember.roles.highest.toString()}\n**Booster:** ${targetMember.premiumSince ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: 'Status',
                        value: `**Presence:** ${targetMember.presence?.status || 'offline'}\n**Nickname:** ${targetMember.nickname || 'None'}\n**In Server:** Yes`,
                        inline: true
                    },
                    {
                        name: `Roles (${targetMember.roles.cache.size - 1})`,
                        value: roleDisplay + moreRoles,
                        inline: false
                    }
                );

                const keyPermissions = [];
                if (targetMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    keyPermissions.push('Administrator');
                }
                if (targetMember.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    keyPermissions.push('Manage Server');
                }
                if (targetMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                    keyPermissions.push('Ban Members');
                }
                if (targetMember.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                    keyPermissions.push('Kick Members');
                }
                if (targetMember.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    keyPermissions.push('Manage Messages');
                }

                if (keyPermissions.length > 0) {
                    whoisEmbed.addFields({
                        name: 'Key Permissions',
                        value: keyPermissions.join('\n'),
                        inline: true
                    });
                }
            } else {
                whoisEmbed.addFields({
                    name: 'Server Status',
                    value: 'Not in this server',
                    inline: true
                });
            }

            try {
                const fs = require('fs');
                const path = require('path');
                const infractionsPath = path.join(__dirname, '..', 'data', 'infractions.json');
                
                if (fs.existsSync(infractionsPath)) {
                    const infractions = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
                    if (infractions[targetUser.id] && infractions[targetUser.id].warnings.length > 0) {
                        const warningCount = infractions[targetUser.id].warnings.length;
                        let warningLevel = 'Low';
                        if (warningCount >= 3) warningLevel = 'High Risk';
                        else if (warningCount >= 2) warningLevel = 'Moderate';

                        whoisEmbed.addFields({
                            name: 'Moderation History',
                            value: `**Warnings:** ${warningCount}\n**Risk Level:** ${warningLevel}`,
                            inline: true
                        });
                    }
                }
            } catch (error) {
            }

            message.reply({ embeds: [whoisEmbed] });

            console.log(`${message.author.tag} viewed info for ${targetUser.tag}`);

        } catch (error) {
            console.error('Error executing whois command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while retrieving user information.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};
