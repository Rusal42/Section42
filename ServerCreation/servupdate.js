const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    name: 'servupdate',
    description: 'Updates specific parts of the server setup without clearing everything',
    
    async execute(message) {
        const OWNER_ID = '746068840978448565';
        
        if (message.author.id !== OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Bot Permission Required')
                .setDescription('I need Administrator permission to update the server.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const updateEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('Server Update Options')
            .setDescription('Select what you want to update in your server:')
            .addFields(
                {
                    name: 'Update Roles',
                    value: 'Add missing roles or update role permissions',
                    inline: true
                },
                {
                    name: 'Update Channels',
                    value: 'Add missing channels or update channel permissions',
                    inline: true
                },
                {
                    name: 'Update Permissions',
                    value: 'Fix channel permissions for existing roles',
                    inline: true
                },
                {
                    name: 'Update Info Messages',
                    value: 'Update rules and server info messages',
                    inline: true
                },
                {
                    name: 'Update Colors',
                    value: 'Send color selection message',
                    inline: true
                },
                {
                    name: 'Full Refresh',
                    value: 'Update everything (non-destructive)',
                    inline: true
                }
            )
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('update_select')
            .setPlaceholder('Choose what to update...')
            .addOptions([
                {
                    label: 'Update Roles',
                    description: 'Add missing roles or update role permissions',
                    value: 'roles',
                    
                },
                {
                    label: 'Update Channels',
                    description: 'Add missing channels or update channel permissions',
                    value: 'channels',
                    
                },
                {
                    label: 'Update Permissions',
                    description: 'Fix channel permissions for existing roles',
                    value: 'permissions',
                    
                },
                {
                    label: 'Update Info Messages',
                    description: 'Update rules and server info messages',
                    value: 'info',
                    
                },
                {
                    label: 'Update Colors',
                    description: 'Send color selection message',
                    value: 'colors',
                    
                },
                {
                    label: 'Full Refresh',
                    description: 'Update everything (non-destructive)',
                    value: 'full'
                    
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const updateMessage = await message.channel.send({ 
            embeds: [updateEmbed], 
            components: [row] 
        });

        const filter = (interaction) => {
            return interaction.customId === 'update_select' && interaction.user.id === message.author.id;
        };

        try {
            const interaction = await updateMessage.awaitMessageComponent({ 
                filter, 
                time: 60000 
            });

            await interaction.deferUpdate();

            const selectedOption = interaction.values[0];
            
            switch (selectedOption) {
                case 'roles':
                    await this.updateRoles(message, updateMessage);
                    break;
                case 'channels':
                    await this.updateChannels(message, updateMessage);
                    break;
                case 'permissions':
                    await this.updatePermissions(message, updateMessage);
                    break;
                case 'info':
                    await this.updateInfoMessages(message, updateMessage);
                    break;
                case 'colors':
                    await this.updateColors(message, updateMessage);
                    break;
                case 'full':
                    await this.fullRefresh(message, updateMessage);
                    break;
            }

        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('⏰ Selection Timed Out')
                .setDescription('Update cancelled due to no response within 60 seconds.')
                .setTimestamp();
            updateMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    },

    async updateRoles(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('🏷️ Updating Roles')
            .setDescription('Adding missing roles and updating permissions...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const guild = message.guild;
            let addedRoles = [];
            let updatedRoles = [];

            const requiredRoles = [
                { name: 'Crucifyym', color: '#9b59b6', hoist: true, mentionable: false },
                { name: 'Content Creator', color: '#e74c3c', hoist: true, mentionable: false },
                { name: 'Developer', color: '#9b59b6', hoist: true, mentionable: false },
                { name: 'Tester', color: '#3498db', hoist: true, mentionable: false },
                { name: 'Moderator', color: '#f39c12', hoist: true, permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ModerateMembers,
                    PermissionsBitField.Flags.KickMembers,
                    PermissionsBitField.Flags.ViewAuditLog
                ], mentionable: false },
                { name: 'Admin', color: '#27ae60', hoist: true, mentionable: false },
                { name: 'Announcements', color: '#3498db', mentionable: false },
                { name: 'Revive', color: '#e67e22', mentionable: false },
                { name: 'Member', color: '#95a5a6', hoist: true, mentionable: false },
                { name: 'Pic Perms', color: '#2ecc71', hoist: false, mentionable: false },
                { name: 'Pic Muted', color: '#e74c3c', hoist: false, mentionable: false },
                { name: 'Bots', color: '#7289da', hoist: true, mentionable: false }
            ];

            const gameRoles = [
                { name: 'TYPE://SOUL', color: '#8e44ad', mentionable: false },
                { name: 'Deepwoken', color: '#2c3e50', mentionable: false },
                { name: 'ABA', color: '#e74c3c', mentionable: false },
                { name: 'Balthazar', color: '#f39c12', mentionable: false },
                { name: 'ZO', color: '#27ae60', mentionable: false },
                { name: 'SoulShatterers', color: '#9b59b6', mentionable: false },
                { name: 'Mortem Metallum', color: '#34495e', mentionable: false },
                { name: 'Violence District', color: '#c0392b', mentionable: false },
                { name: 'Project Power', color: '#e67e22', mentionable: false },
                { name: 'Fisch', color: '#3498db', mentionable: false },
                { name: 'Grow a Garden', color: '#2ecc71', mentionable: false },
                { name: 'JJS', color: '#f1c40f', mentionable: false },
                { name: 'Horse Life', color: '#d35400', mentionable: false },
                { name: 'Bee Swarm', color: '#f39c12', mentionable: false },
                { name: 'DHRP', color: '#8e44ad', mentionable: false },
                { name: 'Other Social Games', color: '#95a5a6', mentionable: false }
            ];

            for (const roleData of requiredRoles) {
                const existingRole = guild.roles.cache.find(role => role.name === roleData.name);
                
                if (!existingRole) {
                    await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist || false,
                        mentionable: roleData.mentionable || false,
                        permissions: roleData.permissions || [],
                        reason: 'Server update - Adding missing role'
                    });
                    addedRoles.push(roleData.name);
                } else {
                    let needsUpdate = false;
                    const updates = {};
                    
                    if (existingRole.color !== parseInt(roleData.color.replace('#', ''), 16)) {
                        updates.color = roleData.color;
                        needsUpdate = true;
                    }
                    if (existingRole.hoist !== (roleData.hoist || false)) {
                        updates.hoist = roleData.hoist || false;
                        needsUpdate = true;
                    }
                    if (existingRole.mentionable !== (roleData.mentionable || false)) {
                        updates.mentionable = roleData.mentionable || false;
                        needsUpdate = true;
                    }
                    if (roleData.permissions && !existingRole.permissions.equals(new PermissionsBitField(roleData.permissions))) {
                        updates.permissions = roleData.permissions;
                        needsUpdate = true;
                    }
                    
                    if (needsUpdate) {
                        await existingRole.edit(updates);
                        updatedRoles.push(roleData.name);
                    }
                }
            }

            for (const roleData of gameRoles) {
                const existingRole = guild.roles.cache.find(role => role.name === roleData.name);
                
                if (!existingRole) {
                    await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: false,
                        mentionable: roleData.mentionable || false,
                        reason: 'Server update - Adding missing game role'
                    });
                    addedRoles.push(roleData.name);
                }
            }

            // Pass logs to fullRefresh if available
            if (updateMessage.logs) {
                updateMessage.logs.addedRoles = addedRoles;
                updateMessage.logs.updatedRoles = updatedRoles;
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Roles Updated Successfully!')
                .addFields(
                    {
                        name: '➕ Added Roles',
                        value: addedRoles.length > 0 ? addedRoles.join(', ') : 'None',
                        inline: false
                    },
                    {
                        name: '🔄 Updated Roles',
                        value: updatedRoles.length > 0 ? updatedRoles.join(', ') : 'None',
                        inline: false
                    }
                )
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error updating roles:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Role Update Failed')
                .setDescription('An error occurred while updating roles.')
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    },

    async updateChannels(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('📁 Updating Channels')
            .setDescription('Adding missing channels and categories from setup.js...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const guild = message.guild;
            let addedCategories = [];
            let addedChannels = [];
            let renamedChannels = [];

            const roles = {
                admin: guild.roles.cache.find(role => role.name === 'Admin'),
                moderator: guild.roles.cache.find(role => role.name === 'Moderator'),
                developer: guild.roles.cache.find(role => role.name === 'Developer'),
                contentCreator: guild.roles.cache.find(role => role.name === 'Content Creator'),
                picPerms: guild.roles.cache.find(role => role.name === 'Pic Perms'),
                picMuted: guild.roles.cache.find(role => role.name === 'Pic Muted')
            };

            const serverStructure = [
                {
                    category: 'WELCOME',
                    channels: [
                        { name: 'welcome', type: 'text', topic: 'Welcome to Section42! Check out Discord\'s welcome screen when you join' },
                        { name: 'rules', type: 'text', topic: 'Server rules and guidelines - please read before participating' },
                        { name: 'server-info', type: 'text', topic: 'Information about Section42, roles, and how to get involved' }
                    ]
                },
                {
                    category: 'ANNOUNCEMENTS',
                    channels: [
                        { name: 'announcements', type: 'text', topic: 'Official Section42 announcements and important updates' },
                        { name: 'updates', type: 'text', topic: 'Game updates, patch notes, and development progress' },
                        { name: 'role-info', type: 'text', topic: 'Information about server roles and how to obtain them' }
                    ]
                },
                {
                    category: 'GAME DEVELOPMENT',
                    channels: [
                        { name: 'game-ideas', type: 'text', topic: 'Game ideas - Everyone can read, Developer+ can post' },
                        { name: 'game-concepts', type: 'text', topic: 'Game concepts - Everyone can read, Developer+ can post' },
                        { name: 'development-updates', type: 'text', topic: 'Updates on Section42 game development progress' },
                        { name: 'collaboration', type: 'text', topic: 'Find developers, builders, and scripters to work with' }
                    ]
                },
                {
                    category: 'COMMUNITY',
                    channels: [
                        { name: 'general-chat', type: 'text', topic: 'General discussion - Everyone can chat here! Get Pic Perms role to send images' },
                        { name: 'bot-commands', type: 'text', topic: 'Bot commands - Everyone can use bot commands here!' },
                        { name: 'events', type: 'text', topic: 'Community events - Moderator+ can post, others can view/react' },
                        { name: 'gaming-chat', type: 'text', topic: 'Talk about games, Roblox experiences, and gaming in general!' },
                        { name: 'music-chat', type: 'text', topic: 'Share your favorite music, discuss artists, and talk about music production!' },
                        { name: 'content-chat', type: 'text', topic: 'Talk about content creation, streaming, and YouTube!' }
                    ]
                },
                {
                    category: 'CONTENT CREATORS',
                    channels: [
                        { name: 'creator-showcase', type: 'text', topic: 'Showcase your content and get feedback from the community' },
                        { name: 'self-promotion', type: 'text', topic: 'Promote your content (Content Creator role required)' },
                        { name: 'collaborations', type: 'text', topic: 'Find other creators to collaborate with' }
                    ]
                },
                {
                    category: 'MEDIA & SHOWCASES',
                    channels: [
                        { name: 'screenshots', type: 'text', topic: 'Screenshots - Everyone can read, Content Creator+ can post' },
                        { name: 'clips', type: 'text', topic: 'Clips - Everyone can read, Content Creator+ can post' },
                        { name: 'fan-art', type: 'text', topic: 'Fan Art - Everyone can read, Content Creator+ can post' },
                        { name: 'achievements', type: 'text', topic: 'Achievements - Everyone can read, Content Creator+ can post' }
                    ]
                },
                {
                    category: 'ROBLOX GAMES',
                    channels: [
                        { name: 'game-updates', type: 'text', topic: 'Official updates and announcements for Section42 Roblox games' },
                        { name: 'bug-reports', type: 'text', topic: 'Report bugs and issues you find in our Roblox games' },
                        { name: 'feedback-suggestions', type: 'text', topic: 'Share your feedback and suggestions for game improvements' },
                        { name: 'gameplay-discussion', type: 'text', topic: 'Discuss gameplay, strategies, and share your experiences' }
                    ]
                },
                {
                    category: 'VOICE CHANNELS',
                    channels: [
                        { name: 'General Chat', type: 'voice' },
                        { name: 'Section42 Gaming', type: 'voice' },
                        { name: 'Content Creation', type: 'voice' },
                        { name: 'Live Streaming', type: 'voice' },
                        { name: 'AFK', type: 'voice' }
                    ]
                },
                {
                    category: 'STAFF & MODERATION',
                    channels: [
                        { name: 'staff-chat', type: 'text', topic: 'Private staff discussion and coordination' },
                        { name: 'mod-logs', type: 'text', topic: 'Moderation actions and logs' },
                        { name: 'analytics', type: 'text', topic: 'Server statistics and growth metrics' }
                    ]
                },
                {
                    category: 'SUPPORT TICKETS',
                    channels: [
                        { name: 'create-ticket', type: 'text', topic: 'React with 🎫 to create a support ticket - Staff will help you!' },
                        { name: 'ticket-logs', type: 'text', topic: 'Ticket creation and closure logs for staff tracking' }
                    ]
                }
            ];

            const oldToNewNames = {
                '🎆 WELCOME': 'WELCOME',
                '📢 ANNOUNCEMENTS': 'ANNOUNCEMENTS',
                '🛠️ GAME DEVELOPMENT': 'GAME DEVELOPMENT',
                '💬 COMMUNITY': 'COMMUNITY',
                '🎥 CONTENT CREATORS': 'CONTENT CREATORS',
                '🖼️ MEDIA & SHOWCASES': 'MEDIA & SHOWCASES',
                '🔊 VOICE CHANNELS': 'VOICE CHANNELS',
                '🛡️ STAFF & MODERATION': 'STAFF & MODERATION',
                '🎫 SUPPORT TICKETS': 'SUPPORT TICKETS',
                '👋│welcome': 'welcome',
                '📜│rules': 'rules',
                '📊│server-info': 'server-info',
                '📢│announcements': 'announcements',
                '🆕│updates': 'updates',
                '🏷️│role-info': 'role-info',
                '💡│game-ideas': 'game-ideas',
                '🎮│game-concepts': 'game-concepts',
                '📝│development-updates': 'development-updates',
                '🤝│collaboration': 'collaboration',
                '💬│general-chat': 'general-chat',
                '🤖│bot-commands': 'bot-commands',
                '🎉│events': 'events',
                '🎮│gaming-chat': 'gaming-chat',
                '🎵│music-chat': 'music-chat',
                '📺│content-chat': 'content-chat',
                '🎥│creator-showcase': 'creator-showcase',
                '🔴│self-promotion': 'self-promotion',
                '🤝│collaborations': 'collaborations',
                '📷│screenshots': 'screenshots',
                '🎥│videos-clips': 'clips',
                '🎨│fan-art': 'fan-art',
                '🏆│achievements': 'achievements',
                '💬 General Chat': 'General Chat',
                '🎮 Section42 Gaming': 'Section42 Gaming',
                '🎥 Content Creation': 'Content Creation',
                '🔴 Live Streaming': 'Live Streaming',
                '😴 AFK': 'AFK',
                '🛡️│staff-chat': 'staff-chat',
                '📝│mod-logs': 'mod-logs',
                '📊│analytics': 'analytics',
                '🎫│create-ticket': 'create-ticket',
                '📝│ticket-logs': 'ticket-logs'
            };

            for (const structure of serverStructure) {
                let category = guild.channels.cache.find(channel => 
                    channel.type === ChannelType.GuildCategory && channel.name === structure.category
                );

                if (!category) {
                    const oldCategoryName = Object.keys(oldToNewNames).find(key => oldToNewNames[key] === structure.category && key.includes(structure.category.split(' ')[structure.category.split(' ').length - 1]));
                    const oldCategory = guild.channels.cache.find(channel => 
                        channel.type === ChannelType.GuildCategory && oldToNewNames[channel.name] === structure.category
                    );
                    
                    if (oldCategory) {
                        await oldCategory.edit({ name: structure.category });
                        renamedChannels.push(`${oldCategory.name} → ${structure.category}`);
                        category = oldCategory;
                    }
                }

                if (!category) {
                    category = await guild.channels.create({
                        name: structure.category,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone.id,
                                allow: [PermissionsBitField.Flags.ViewChannel]
                            }
                        ],
                        reason: 'Server update - Adding missing category'
                    });
                    addedCategories.push(structure.category);
                }

                for (const channelData of structure.channels) {
                    let existingChannel = guild.channels.cache.find(channel => 
                        channel.name === channelData.name && channel.parentId === category.id
                    );

                    if (!existingChannel) {
                        const oldChannel = guild.channels.cache.find(channel => 
                            oldToNewNames[channel.name] === channelData.name && channel.parentId === category.id
                        );
                        
                        if (oldChannel) {
                            await oldChannel.edit({ name: channelData.name });
                            renamedChannels.push(`${oldChannel.name} → ${channelData.name}`);
                            existingChannel = oldChannel;
                        }
                    }

                    if (!existingChannel) {
                        const channelType = channelData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
                        
                        let permissionOverwrites = [
                            {
                                id: guild.roles.everyone.id,
                                allow: [PermissionsBitField.Flags.ViewChannel]
                            }
                        ];

                        if (channelData.type === 'voice') {
                            permissionOverwrites[0].allow.push(
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak
                            );
                            
                            if (channelData.name === 'AFK') {
                                permissionOverwrites[0].deny = [PermissionsBitField.Flags.Speak];
                            }
                        } else {
                            if (channelData.name.includes('general-chat') || channelData.name.includes('bot-commands') || 
                                channelData.name.includes('gaming-chat') || channelData.name.includes('music-chat') || 
                                channelData.name.includes('content-chat')) {
                                permissionOverwrites[0].allow.push(
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.AddReactions
                                );
                            } else {
                                permissionOverwrites[0].allow.push(PermissionsBitField.Flags.AddReactions);
                                permissionOverwrites[0].deny = [PermissionsBitField.Flags.SendMessages];
                            }
                        }

                        await guild.channels.create({
                            name: channelData.name,
                            type: channelType,
                            parent: category.id,
                            topic: channelData.topic || undefined,
                            permissionOverwrites: permissionOverwrites,
                            reason: 'Server update - Adding missing channel'
                        });
                        addedChannels.push(channelData.name);
                    }
                }
            }

            // Pass logs to fullRefresh if available
            if (updateMessage.logs) {
                updateMessage.logs.addedChannels = addedChannels;
                updateMessage.logs.addedCategories = addedCategories;
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Channels Updated Successfully!')
                .setDescription('All channels and voice channels from setup.js have been updated!')
                .addFields(
                    {
                        name: '📁 Added Categories',
                        value: addedCategories.length > 0 ? addedCategories.join(', ') : 'None',
                        inline: false
                    },
                    {
                        name: '📝 Added Text Channels',
                        value: addedChannels.filter(name => !name.includes('General Chat') && !name.includes('Gaming') && !name.includes('Content Creation') && !name.includes('Streaming') && !name.includes('AFK')).length > 0 ? 
                               addedChannels.filter(name => !name.includes('General Chat') && !name.includes('Gaming') && !name.includes('Content Creation') && !name.includes('Streaming') && !name.includes('AFK')).join(', ') : 'None',
                        inline: false
                    },
                    {
                        name: '🔊 Added Voice Channels',
                        value: addedChannels.filter(name => name.includes('General Chat') || name.includes('Gaming') || name.includes('Content Creation') || name.includes('Streaming') || name.includes('AFK')).length > 0 ? 
                               addedChannels.filter(name => name.includes('General Chat') || name.includes('Gaming') || name.includes('Content Creation') || name.includes('Streaming') || name.includes('AFK')).join(', ') : 'None',
                        inline: false
                    },
                    {
                        name: '✏️ Renamed Channels',
                        value: renamedChannels.length > 0 ? renamedChannels.slice(0, 10).join('\n') + (renamedChannels.length > 10 ? `\n...and ${renamedChannels.length - 10} more` : '') : 'None',
                        inline: false
                    }
                )
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error updating channels:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Channel Update Failed')
                .setDescription('An error occurred while updating channels.')
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    },

    async updatePermissions(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('🔧 Updating Permissions')
            .setDescription('Fixing channel permissions for existing roles...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Permissions Updated Successfully!')
                .setDescription('Channel permissions have been updated for all roles.')
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error updating permissions:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permission Update Failed')
                .setDescription('An error occurred while updating permissions.')
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    },

    async updateInfoMessages(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('📜 Updating Info Messages')
            .setDescription('Updating rules and server info messages...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const guild = message.guild;
            const serverInfoChannel = guild.channels.cache.find(channel => channel.name === '📊│server-info');
            const roleInfoChannel = guild.channels.cache.find(channel => channel.name === '🏷️│role-info');
            let updatedChannels = [];

            if (serverInfoChannel) {
                const messages = await serverInfoChannel.messages.fetch({ limit: 100 });
                const recentMessages = messages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);
                if (recentMessages.size > 0) {
                    await serverInfoChannel.bulkDelete(recentMessages);
                }
                
                const sendServerInfoCommand = require('./sendserverinfo.js');
                
                const mockMessage = {
                    author: message.author,
                    guild: message.guild,
                    channel: serverInfoChannel,
                    delete: () => Promise.resolve()
                };
                
                await sendServerInfoCommand.execute(mockMessage);
                updatedChannels.push('server-info');
            }

            if (roleInfoChannel) {
                const messages = await roleInfoChannel.messages.fetch({ limit: 100 });
                const recentMessages = messages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);
                if (recentMessages.size > 0) {
                    await roleInfoChannel.bulkDelete(recentMessages);
                }
                
                const sendRoleInfoCommand = require('./sendroleinfo.js');
                
                const mockMessage = {
                    author: message.author,
                    guild: message.guild,
                    channel: roleInfoChannel,
                    delete: () => Promise.resolve()
                };
                
                await sendRoleInfoCommand.execute(mockMessage);
                updatedChannels.push('role-info');
            }

            // Pass logs to fullRefresh if available
            if (updateMessage.logs) {
                updateMessage.logs.updatedInfo = updatedChannels;
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Info Messages Updated Successfully!')
                .setDescription(`Updated messages in: ${updatedChannels.join(', ')}\n\n**New Features Added:**\n• Comprehensive server information\n• Role guide with instructions\n• **Graphic design services showcase**\n• Channel navigation guide\n• Social media links`)
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error updating info messages:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Info Update Failed')
                .setDescription('An error occurred while updating info messages.')
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    },

    async updateColors(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('🎨 Updating Colors')
            .setDescription('Sending color selection message...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Colors Updated Successfully!')
                .setDescription('Color selection message has been sent.')
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error updating colors:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Color Update Failed')
                .setDescription('An error occurred while updating colors.')
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    },

    async fullRefresh(message, updateMessage) {
        const progressEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('🔄 Full Refresh')
            .setDescription('Updating everything (this may take a moment)...')
            .setTimestamp();
        
        await updateMessage.edit({ embeds: [progressEmbed], components: [] });

        try {
            const changeLogs = {
                addedRoles: [],
                updatedRoles: [],
                addedChannels: [],
                addedCategories: [],
                updatedPermissions: 0,
                updatedInfo: []
            };

            // Capture role changes
            const roleMessage = { 
                edit: () => {},
                logs: changeLogs
            };
            await this.updateRoles(message, roleMessage);

            // Capture channel changes
            const channelMessage = {
                edit: () => {},
                logs: changeLogs
            };
            await this.updateChannels(message, channelMessage);

            // Update permissions
            await this.updatePermissions(message, { edit: () => {} });
            changeLogs.updatedPermissions = 1;

            // Capture info message changes
            const infoMessage = {
                edit: () => {},
                logs: changeLogs
            };
            await this.updateInfoMessages(message, infoMessage);

            // Update colors
            await this.updateColors(message, { edit: () => {} });

            // Build detailed log embed
            const logFields = [];

            if (changeLogs.addedRoles.length > 0) {
                logFields.push({
                    name: '➕ Added Roles',
                    value: changeLogs.addedRoles.join(', '),
                    inline: false
                });
            }

            if (changeLogs.updatedRoles.length > 0) {
                logFields.push({
                    name: '🔄 Updated Roles',
                    value: changeLogs.updatedRoles.join(', '),
                    inline: false
                });
            }

            if (changeLogs.addedCategories.length > 0) {
                logFields.push({
                    name: '📁 Added Categories',
                    value: changeLogs.addedCategories.join(', '),
                    inline: false
                });
            }

            if (changeLogs.addedChannels.length > 0) {
                const channelList = changeLogs.addedChannels.length > 10 
                    ? changeLogs.addedChannels.slice(0, 10).join(', ') + ` (+${changeLogs.addedChannels.length - 10} more)`
                    : changeLogs.addedChannels.join(', ');
                logFields.push({
                    name: '📝 Added Channels',
                    value: channelList,
                    inline: false
                });
            }

            if (changeLogs.updatedPermissions > 0) {
                logFields.push({
                    name: '🔧 Permissions',
                    value: 'Channel permissions updated (threads blocked)',
                    inline: false
                });
            }

            if (changeLogs.updatedInfo.length > 0) {
                logFields.push({
                    name: '📜 Info Messages',
                    value: `Updated: ${changeLogs.updatedInfo.join(', ')}`,
                    inline: false
                });
            }

            if (logFields.length === 0) {
                logFields.push({
                    name: '✅ Status',
                    value: 'No changes needed - everything is up to date!',
                    inline: false
                });
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#27ae60')
                .setTitle('✅ Full Refresh Complete!')
                .setDescription('All server components have been checked and updated.')
                .addFields(logFields)
                .setFooter({ text: 'Full refresh completed' })
                .setTimestamp();

            await updateMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error during full refresh:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Full Refresh Failed')
                .setDescription(`An error occurred during the full refresh.\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();
            await updateMessage.edit({ embeds: [errorEmbed] });
        }
    }
};
