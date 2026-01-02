const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const serverHelper = require('../utils/serverHelper');
const { OWNER_IDS } = require('../config/constants');

module.exports = {
    name: 'serverconfig',
    description: 'Display current server configuration (channels and roles)',
    ownerOnly: true,
    
    data: new SlashCommandBuilder()
        .setName('serverconfig')
        .setDescription('Display current server configuration (channels and roles)'),
    
    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            return;
        }
        
        const guild = message.guild;
        const config = serverHelper.config;
        
        const rolesEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📋 Server Roles Configuration')
            .setDescription('Current roles tracked by the bot:')
            .addFields(
                {
                    name: '🎭 Staff Roles',
                    value: `• **${config.ROLES.CRUCIFYYM}** (Owner)\n• **${config.ROLES.ADMIN}** (Administration)\n• **${config.ROLES.MODERATOR}** (Moderation)`,
                    inline: false
                },
                {
                    name: '👥 Community Roles',
                    value: `• **${config.ROLES.CONTENT_CREATOR}** (Creators)\n• **${config.ROLES.DEVELOPER}** (Developers)\n• **${config.ROLES.FRIENDS}** (Friends)\n• **${config.ROLES.MEMBER}** (Members)`,
                    inline: false
                },
                {
                    name: '🔔 Ping Roles',
                    value: `• **${config.ROLES.ANNOUNCEMENTS}** (Announcements)\n• **${config.ROLES.REVIVE}** (Chat Revival)`,
                    inline: false
                },
                {
                    name: '🖼️ Permission Roles',
                    value: `• **${config.ROLES.PIC_PERMS}** (Image Posting)\n• **${config.ROLES.PIC_MUTED}** (Image Restriction)\n• **${config.ROLES.BOTS}** (Bot Role)`,
                    inline: false
                },
                {
                    name: '🎮 Game Roles',
                    value: config.ROLES.GAME_ROLES.slice(0, 8).join(', ') + '\n' + config.ROLES.GAME_ROLES.slice(8).join(', '),
                    inline: false
                }
            )
            .setTimestamp();
        
        const channelsEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📁 Server Channels Configuration')
            .setDescription('Current channels tracked by the bot:')
            .addFields(
                {
                    name: '🎆 WELCOME',
                    value: config.CHANNELS.WELCOME.channels.join(', '),
                    inline: false
                },
                {
                    name: '📢 ANNOUNCEMENTS',
                    value: config.CHANNELS.ANNOUNCEMENTS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🛠️ GAME DEVELOPMENT',
                    value: config.CHANNELS.GAME_DEVELOPMENT.channels.join(', '),
                    inline: false
                },
                {
                    name: '💬 COMMUNITY',
                    value: config.CHANNELS.COMMUNITY.channels.join(', '),
                    inline: false
                },
                {
                    name: '🎥 CONTENT CREATORS',
                    value: config.CHANNELS.CONTENT_CREATORS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🖼️ MEDIA & SHOWCASES',
                    value: config.CHANNELS.MEDIA_SHOWCASES.channels.join(', '),
                    inline: false
                },
                {
                    name: '👥 FRIENDS & NETWORK',
                    value: config.CHANNELS.FRIENDS_NETWORK.channels.join(', '),
                    inline: false
                },
                {
                    name: '🔊 VOICE CHANNELS',
                    value: config.CHANNELS.VOICE_CHANNELS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🛡️ STAFF & MODERATION',
                    value: config.CHANNELS.STAFF_MODERATION.channels.join(', '),
                    inline: false
                },
                {
                    name: '🎫 SUPPORT TICKETS',
                    value: config.CHANNELS.SUPPORT_TICKETS.channels.join(', '),
                    inline: false
                }
            )
            .setTimestamp();
        
        const verificationEmbed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Verification Status')
            .setDescription('Checking if configured items exist in the server...')
            .setTimestamp();
        
        const existingRoles = [];
        const missingRoles = [];
        
        config.getAllRoleNames().forEach(roleName => {
            const role = serverHelper.getRole(guild, roleName);
            if (role) {
                existingRoles.push(roleName);
            } else {
                missingRoles.push(roleName);
            }
        });
        
        const existingChannels = [];
        const missingChannels = [];
        
        config.getAllChannelNames().forEach(channelName => {
            const channel = serverHelper.getChannel(guild, channelName);
            if (channel) {
                existingChannels.push(channelName);
            } else {
                missingChannels.push(channelName);
            }
        });
        
        verificationEmbed.addFields(
            {
                name: `✅ Roles Found (${existingRoles.length}/${config.getAllRoleNames().length})`,
                value: existingRoles.length > 0 ? existingRoles.slice(0, 10).join(', ') + (existingRoles.length > 10 ? '...' : '') : 'None',
                inline: false
            },
            {
                name: `❌ Roles Missing (${missingRoles.length})`,
                value: missingRoles.length > 0 ? missingRoles.join(', ') : 'None - All roles exist!',
                inline: false
            },
            {
                name: `✅ Channels Found (${existingChannels.length}/${config.getAllChannelNames().length})`,
                value: existingChannels.length > 0 ? existingChannels.slice(0, 10).join(', ') + (existingChannels.length > 10 ? '...' : '') : 'None',
                inline: false
            },
            {
                name: `❌ Channels Missing (${missingChannels.length})`,
                value: missingChannels.length > 0 ? missingChannels.join(', ') : 'None - All channels exist!',
                inline: false
            }
        );
        
        await message.channel.send({ embeds: [rolesEmbed, channelsEmbed, verificationEmbed] });
    },
    
    async executeSlash(interaction) {
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        }
        
        const guild = interaction.guild;
        const config = serverHelper.config;
        
        const rolesEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📋 Server Roles Configuration')
            .setDescription('Current roles tracked by the bot:')
            .addFields(
                {
                    name: '🎭 Staff Roles',
                    value: `• **${config.ROLES.CRUCIFYYM}** (Owner)\n• **${config.ROLES.ADMIN}** (Administration)\n• **${config.ROLES.MODERATOR}** (Moderation)`,
                    inline: false
                },
                {
                    name: '👥 Community Roles',
                    value: `• **${config.ROLES.CONTENT_CREATOR}** (Creators)\n• **${config.ROLES.DEVELOPER}** (Developers)\n• **${config.ROLES.FRIENDS}** (Friends)\n• **${config.ROLES.MEMBER}** (Members)`,
                    inline: false
                },
                {
                    name: '🔔 Ping Roles',
                    value: `• **${config.ROLES.ANNOUNCEMENTS}** (Announcements)\n• **${config.ROLES.REVIVE}** (Chat Revival)`,
                    inline: false
                },
                {
                    name: '🖼️ Permission Roles',
                    value: `• **${config.ROLES.PIC_PERMS}** (Image Posting)\n• **${config.ROLES.PIC_MUTED}** (Image Restriction)\n• **${config.ROLES.BOTS}** (Bot Role)`,
                    inline: false
                },
                {
                    name: '🎮 Game Roles',
                    value: config.ROLES.GAME_ROLES.slice(0, 8).join(', ') + '\n' + config.ROLES.GAME_ROLES.slice(8).join(', '),
                    inline: false
                }
            )
            .setTimestamp();
        
        const channelsEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📁 Server Channels Configuration')
            .setDescription('Current channels tracked by the bot:')
            .addFields(
                {
                    name: '🎆 WELCOME',
                    value: config.CHANNELS.WELCOME.channels.join(', '),
                    inline: false
                },
                {
                    name: '📢 ANNOUNCEMENTS',
                    value: config.CHANNELS.ANNOUNCEMENTS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🛠️ GAME DEVELOPMENT',
                    value: config.CHANNELS.GAME_DEVELOPMENT.channels.join(', '),
                    inline: false
                },
                {
                    name: '💬 COMMUNITY',
                    value: config.CHANNELS.COMMUNITY.channels.join(', '),
                    inline: false
                },
                {
                    name: '🎥 CONTENT CREATORS',
                    value: config.CHANNELS.CONTENT_CREATORS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🖼️ MEDIA & SHOWCASES',
                    value: config.CHANNELS.MEDIA_SHOWCASES.channels.join(', '),
                    inline: false
                },
                {
                    name: '👥 FRIENDS & NETWORK',
                    value: config.CHANNELS.FRIENDS_NETWORK.channels.join(', '),
                    inline: false
                },
                {
                    name: '🔊 VOICE CHANNELS',
                    value: config.CHANNELS.VOICE_CHANNELS.channels.join(', '),
                    inline: false
                },
                {
                    name: '🛡️ STAFF & MODERATION',
                    value: config.CHANNELS.STAFF_MODERATION.channels.join(', '),
                    inline: false
                },
                {
                    name: '🎫 SUPPORT TICKETS',
                    value: config.CHANNELS.SUPPORT_TICKETS.channels.join(', '),
                    inline: false
                }
            )
            .setTimestamp();
        
        const verificationEmbed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Verification Status')
            .setDescription('Checking if configured items exist in the server...')
            .setTimestamp();
        
        const existingRoles = [];
        const missingRoles = [];
        
        config.getAllRoleNames().forEach(roleName => {
            const role = serverHelper.getRole(guild, roleName);
            if (role) {
                existingRoles.push(roleName);
            } else {
                missingRoles.push(roleName);
            }
        });
        
        const existingChannels = [];
        const missingChannels = [];
        
        config.getAllChannelNames().forEach(channelName => {
            const channel = serverHelper.getChannel(guild, channelName);
            if (channel) {
                existingChannels.push(channelName);
            } else {
                missingChannels.push(channelName);
            }
        });
        
        verificationEmbed.addFields(
            {
                name: `✅ Roles Found (${existingRoles.length}/${config.getAllRoleNames().length})`,
                value: existingRoles.length > 0 ? existingRoles.slice(0, 10).join(', ') + (existingRoles.length > 10 ? '...' : '') : 'None',
                inline: false
            },
            {
                name: `❌ Roles Missing (${missingRoles.length})`,
                value: missingRoles.length > 0 ? missingRoles.join(', ') : 'None - All roles exist!',
                inline: false
            },
            {
                name: `✅ Channels Found (${existingChannels.length}/${config.getAllChannelNames().length})`,
                value: existingChannels.length > 0 ? existingChannels.slice(0, 10).join(', ') + (existingChannels.length > 10 ? '...' : '') : 'None',
                inline: false
            },
            {
                name: `❌ Channels Missing (${missingChannels.length})`,
                value: missingChannels.length > 0 ? missingChannels.join(', ') : 'None - All channels exist!',
                inline: false
            }
        );
        
        await interaction.reply({ embeds: [rolesEmbed, channelsEmbed, verificationEmbed], ephemeral: true });
    }
};
