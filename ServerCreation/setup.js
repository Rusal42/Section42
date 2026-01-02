const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'setup',
    description: 'Sets up Section42 Roblox community server with content creator channels',
    
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
                .setDescription('I need Administrator permission to set up the server.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const setupEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('Crucifyym\'s Community Setup')
            .setDescription('Setting up your Roblox community server... This may take a moment.')
            .setTimestamp();
        const setupMessage = await message.channel.send({ embeds: [setupEmbed] });
        
        const setupChannel = message.channel;
        const isServerSetupChannel = setupChannel.name === 'server-setup';

        try {

            const crucifyymRole = await message.guild.roles.create({
                name: 'Crucifyym',
                color: '#9b59b6',
                hoist: true,
                reason: 'Server setup - Owner role'
            });
            const contentCreatorRole = await message.guild.roles.create({
                name: 'Content Creator',
                color: '#e74c3c',
                hoist: true,
                reason: 'Server setup - Content creator role'
            });

            const developerRole = await message.guild.roles.create({
                name: 'Developer',
                color: '#9b59b6',
                hoist: true,
                reason: 'Server setup - Game developer role'
            });

            const moderatorRole = await message.guild.roles.create({
                name: 'Moderator',
                color: '#f39c12',
                hoist: true,
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ModerateMembers,
                    PermissionsBitField.Flags.KickMembers,
                    PermissionsBitField.Flags.ViewAuditLog
                ],
                reason: 'Server setup - Moderator role'
            });

            const adminRole = await message.guild.roles.create({
                name: 'Admin',
                color: '#27ae60',
                hoist: true,
                reason: 'Server setup - Admin role'
            });

            const announcementsRole = await message.guild.roles.create({
                name: 'Announcements',
                color: '#3498db',
                mentionable: true,
                reason: 'Server setup - Announcements ping role'
            });

            const reviveRole = await message.guild.roles.create({
                name: 'Revive',
                color: '#e67e22',
                mentionable: true,
                reason: 'Server setup - Chat revive ping role'
            });

            const memberRole = await message.guild.roles.create({
                name: 'Member',
                color: '#95a5a6',
                hoist: true,
                reason: 'Server setup - Member role for onboarding'
            });

            const friendsRole = await message.guild.roles.create({
                name: 'Friends',
                color: '#3498db',
                hoist: true,
                reason: 'Server setup - Friends role'
            });

            const picPermsRole = await message.guild.roles.create({
                name: 'Pic Perms',
                color: '#2ecc71',
                hoist: false,
                reason: 'Server setup - Role that allows image posting'
            });

            const picMutedRole = await message.guild.roles.create({
                name: 'Pic Muted',
                color: '#e74c3c',
                hoist: false,
                reason: 'Server setup - Role that removes image posting'
            });

            const botsRole = await message.guild.roles.create({
                name: 'Bots',
                color: '#7289da',
                hoist: true,
                reason: 'Server setup - Bot role'
            });

            await message.guild.roles.create({
                name: 'TYPE://SOUL',
                color: '#8e44ad',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Deepwoken',
                color: '#2c3e50',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'ABA',
                color: '#e74c3c',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Balthazar',
                color: '#f39c12',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'ZO',
                color: '#27ae60',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'SoulShatterers',
                color: '#9b59b6',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Mortem Metallum',
                color: '#34495e',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Violence District',
                color: '#c0392b',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Project Power',
                color: '#e67e22',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Fisch',
                color: '#3498db',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Grow a Garden',
                color: '#2ecc71',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'JJS',
                color: '#f1c40f',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Horse Life',
                color: '#d35400',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Bee Swarm',
                color: '#f39c12',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'DHRP',
                color: '#8e44ad',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            await message.guild.roles.create({
                name: 'Other Social Games',
                color: '#95a5a6',
                hoist: false,
                reason: 'Server setup - Game role for onboarding'
            });

            
            const welcomeCategory = await message.guild.channels.create({
                name: 'WELCOME',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const announcementsCategory = await message.guild.channels.create({
                name: 'ANNOUNCEMENTS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const gameDevCategory = await message.guild.channels.create({
                name: 'GAME DEVELOPMENT',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const communityCategory = await message.guild.channels.create({
                name: 'COMMUNITY',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const creatorsCategory = await message.guild.channels.create({
                name: 'CONTENT CREATORS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const mediaCategory = await message.guild.channels.create({
                name: 'MEDIA & SHOWCASES',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const friendsCategory = await message.guild.channels.create({
                name: 'FRIENDS & NETWORK',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const voiceCategory = await message.guild.channels.create({
                name: 'VOICE CHANNELS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const staffCategory = await message.guild.channels.create({
                name: 'STAFF & MODERATION',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            const ticketsCategory = await message.guild.channels.create({
                name: 'SUPPORT TICKETS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'welcome',
                type: ChannelType.GuildText,
                parent: welcomeCategory.id,
                topic: 'Welcome to Section42! Check out Discord\'s welcome screen when you join',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'rules',
                type: ChannelType.GuildText,
                parent: welcomeCategory.id,
                topic: 'Server rules and guidelines - please read before participating',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'server-info',
                type: ChannelType.GuildText,
                parent: welcomeCategory.id,
                topic: 'Information about Section42, roles, and how to get involved',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'announcements',
                type: ChannelType.GuildText,
                parent: announcementsCategory.id,
                topic: 'Official Section42 announcements and important updates',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'updates',
                type: ChannelType.GuildText,
                parent: announcementsCategory.id,
                topic: 'Game updates, patch notes, and development progress',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            const roleInfoChannel = await message.guild.channels.create({
                name: 'role-info',
                type: ChannelType.GuildText,
                parent: announcementsCategory.id,
                topic: 'Information about server roles and how to obtain them',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'game-ideas',
                type: ChannelType.GuildText,
                parent: gameDevCategory.id,
                topic: 'Game ideas - Everyone can read, Developer+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: developerRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'game-concepts',
                type: ChannelType.GuildText,
                parent: gameDevCategory.id,
                topic: 'Game concepts - Everyone can read, Developer+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: developerRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'development-updates',
                type: ChannelType.GuildText,
                parent: gameDevCategory.id,
                topic: 'Updates on Section42 game development progress',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: developerRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'collaboration',
                type: ChannelType.GuildText,
                parent: gameDevCategory.id,
                topic: 'Find developers, builders, and scripters to work with',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: contentCreatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: developerRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'general-chat',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                topic: 'General discussion - Everyone can chat here! Get Pic Perms role to send images',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions
                        ],
                        deny: [PermissionsBitField.Flags.AttachFiles]
                    },
                    {
                        id: picPermsRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    },
                    {
                        id: picMutedRole.id,
                        deny: [PermissionsBitField.Flags.AttachFiles]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'bot-commands',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                topic: 'Bot commands - Everyone can use bot commands here!',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'events',
                type: ChannelType.GuildText,
                parent: communityCategory.id,
                topic: 'Community events - Moderator+ can post, others can view/react',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'screenshots',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Screenshots - Everyone can read, Content Creator+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'clips',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Video clips - Everyone can read, Content Creator+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'fan-art',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Fan art - Everyone can read, Content Creator+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'achievements',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Achievements - Everyone can read, Content Creator+ can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'General Chat',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'Section42 Gaming',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'Content Creation',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'Live Streaming',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            const afkChannel = await message.guild.channels.create({
                name: 'AFK',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect
                        ],
                        deny: [PermissionsBitField.Flags.Speak]
                    }
                ],
                reason: 'Server setup'
            });

            if (afkChannel) {
                await message.guild.setAFKChannel(afkChannel);
                await message.guild.setAFKTimeout(300); // 5 minutes
            }

            await message.guild.channels.create({
                name: 'creator-showcase',
                type: ChannelType.GuildText,
                parent: creatorsCategory.id,
                topic: 'Showcase your content - Everyone can view, Content Creators can post',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: contentCreatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'self-promotion',
                type: ChannelType.GuildText,
                parent: creatorsCategory.id,
                topic: 'Self-promotion for Content Creators only',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: contentCreatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'staff-chat',
                type: ChannelType.GuildText,
                parent: staffCategory.id,
                topic: 'Staff discussion and coordination',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    },
                    {
                        id: adminRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.AttachFiles
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'mod-logs',
                type: ChannelType.GuildText,
                parent: staffCategory.id,
                topic: 'Moderation action logs',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: adminRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: 'analytics',
                type: ChannelType.GuildText,
                parent: staffCategory.id,
                topic: 'Server analytics and statistics',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    },
                    {
                        id: adminRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    }
                ],
                reason: 'Server setup'
            });


            try {
                const rulesChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '📜│rules' && channel.type === ChannelType.GuildText
                );
                
                if (rulesChannel) {
                    const rulesEmbed = new EmbedBuilder()
                        .setColor('#1e3a8a')
                        .setTitle('📜 Crucifyym\'s Community Rules')
                        .setDescription('Welcome to **Crucifyym\'s Community**! Please read and follow our rules to maintain a positive environment for all members.')
                        .addFields(
                            {
                                name: '1️⃣ Be Respectful',
                                value: 'Treat all members with respect. No harassment, bullying, or toxic behavior.',
                                inline: false
                            },
                            {
                                name: '2️⃣ No NSFW Content',
                                value: 'Keep all content appropriate. No NSFW, gore, or inappropriate material.',
                                inline: false
                            },
                            {
                                name: '3️⃣ Use Appropriate Channels',
                                value: 'Post content in the correct channels. Self-promotion goes in designated areas only.',
                                inline: false
                            },
                            {
                                name: '4️⃣ No Spam or Flooding',
                                value: 'Don\'t spam messages, emojis, or flood channels with repetitive content.',
                                inline: false
                            },
                            {
                                name: '5️⃣ Content Creator Guidelines',
                                value: 'Self-promotion is allowed in designated channels. Support fellow creators!',
                                inline: false
                            },
                            {
                                name: '6️⃣ Trading Rules',
                                value: 'All trades must be fair. No scamming or fraudulent activity.',
                                inline: false
                            },
                            {
                                name: '7️⃣ Staff Authority',
                                value: 'Staff decisions are final. If you have concerns, DM staff privately.',
                                inline: false
                            },
                            {
                                name: '8️⃣ English Only',
                                value: 'Please communicate in English to ensure everyone can participate.',
                                inline: false
                            }
                        )
                        .addFields(
                            {
                                name: '🎮 About Section42',
                                value: 'Section42 is a Roblox group focused on creating amazing experiences. Join our community to stay updated!',
                                inline: false
                            },
                            {
                                name: '⚠️ Violations',
                                value: 'Rule violations may result in warnings, mutes, kicks, or bans depending on severity.',
                                inline: false
                            }
                        )
                        .setThumbnail(message.guild.iconURL())
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Welcome to the Section42 community!', 
                            iconURL: message.guild.iconURL() 
                        });

                    await rulesChannel.send({ 
                        embeds: [rulesEmbed]
                    });
                    
                    console.log('📜 Automatically deployed rules message to rules channel');
                }
            } catch (error) {
                console.error('Error deploying rules message:', error);
            }

            try {
                if (roleInfoChannel) {
                    const roleInfoEmbed = new EmbedBuilder()
                        .setColor('#1e3a8a')
                        .setTitle('🏷️ Crucifyym\'s Community Roles')
                        .setDescription('Learn about our server roles and how to obtain them!')
                        .addFields(
                            {
                                name: '🔴 **Content Creator**',
                                value: 'Special permissions for content creators\n• Access to exclusive self-promotion channel\n• Enhanced creator permissions\n• **How to get:** Show your content and make a ticket or DM <@746068840978448565>',
                                inline: false
                            },
                            {
                                name: '🔵 **Friends**',
                                value: 'For close friends and network members\n• Access to friends channels and showcase\n• Special permissions in friends category\n• **How to get:** Be invited by the owner or make a ticket',
                                inline: false
                            },
                            {
                                name: '🟣 **Developer**',
                                value: 'For Section42 game developers\n• Access to collaboration channels\n• Work directly with content creators\n• **How to get:** Show your development skills and make a ticket or DM <@746068840978448565>',
                                inline: false
                            },
                            {
                                name: '🟡 **Moderator**',
                                value: 'Community moderation team\n• Moderation permissions\n• Access to staff channels\n• **How to get:** Apply when applications are open or be invited by staff',
                                inline: false
                            },
                            {
                                name: '🟢 **Admin**',
                                value: 'Server administration team\n• Full server management\n• Access to all channels\n• **How to get:** Promoted from Moderator by server owner',
                                inline: false
                            },
                            {
                                name: '🎫 **How to Apply**',
                                value: '• **Make a ticket** using our ticket system\n• **DM the owner** <@746068840978448565> directly\n• **Show your work** - provide examples of content/development\n• **Be active** in the community first\n\n**Note:** All role applications are reviewed manually',
                                inline: false
                            }
                        )
                        .setThumbnail(message.guild.iconURL())
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Crucifyym\'s Community Role Information', 
                            iconURL: message.guild.iconURL() 
                        });

                    await roleInfoChannel.send({ embeds: [roleInfoEmbed] });
                    
                    console.log('🏷️ Automatically deployed role info to role-info channel');
                }
            } catch (error) {
                console.error('Error deploying role info:', error);
            }

            try {
                const serverInfoChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '📊│server-info' && channel.type === ChannelType.GuildText
                );
                
                if (serverInfoChannel) {
                    const infoEmbed = new EmbedBuilder()
                        .setColor('#1e3a8a')
                        .setTitle('🎮 Welcome to Crucifyym\'s Community!')
                        .setDescription('Your ultimate community for content creators, gamers, and music lovers!')
                        .addFields(
                            {
                                name: '🎆 About This Community',
                                value: 'Welcome to Crucifyym\'s community! This is where content creators, gamers, and music lovers come together. We support Section42 Roblox group and create amazing content across multiple platforms.',
                                inline: false
                            },
                            {
                                name: '🎥 Content Creators',
                                value: 'Share your videos, streams, and content in our creator channels. Get promoted and collaborate with others!',
                                inline: false
                            },
                            {
                                name: '🔗 Important Links',
                                value: '• **Roblox Group**: [Join Section42](https://www.roblox.com/communities/6957007/Section42#!/about)\n• **Follow**: [crucifyym](https://www.roblox.com/users/489110745/profile)\n• **YouTube**: [crucifyym](https://www.youtube.com/@crucifyym)\n• **Twitch**: [crucifyym](https://www.twitch.tv/crucifyym)\n• **TikTok**: [crucifyym](https://www.tiktok.com/@crucifyym)\n• **SoundCloud**: [rusal-42](https://soundcloud.com/rusal-42)\n• **BandLab**: [crucifyym](https://www.bandlab.com/crucifyym)\n• **Discord**: You\'re here!',
                                inline: false
                            },
                            {
                                name: '🌟 How to Get Started',
                                value: '1. Read the rules in <#rules>\n2. Introduce yourself in <#welcome>\n3. Explore our channels and join the community!\n4. Share your content and engage with others',
                                inline: false
                            }
                        )
                        .setThumbnail(message.guild.iconURL())
                        .setTimestamp()
                        .setFooter({ text: 'Welcome to Crucifyym\'s Community!', iconURL: message.guild.iconURL() });

                    try {
                        await serverInfoChannel.send({ 
                            embeds: [infoEmbed]
                        });
                        console.log('✅ Successfully deployed server info to server-info channel');
                    } catch (infoError) {
                        console.error('Error deploying server info:', infoError);
                        try {
                            await serverInfoChannel.send({ embeds: [infoEmbed] });
                            console.log('✅ Server info deployed without buttons as fallback');
                        } catch (fallbackError) {
                            console.error('Failed to deploy server info even without buttons:', fallbackError);
                        }
                    }
                    
                    console.log('📊 Automatically deployed server info to server-info channel');
                }
            } catch (error) {
                console.error('Error deploying server info:', error);
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('✅ Crucifyym\'s Community Server Setup Complete!')
                .setDescription('Your community server is ready for content creators, gamers, and music lovers!')
                .addFields(
                    {
                        name: '📁 Server Structure (9 Categories)',
                        value: '🎆 **WELCOME** - Welcome, rules, server info\n📢 **ANNOUNCEMENTS** - Official updates and news\n🛠️ **GAME DEVELOPMENT** - Ideas, concepts, updates, collaboration\n💬 **COMMUNITY** - General chat, events, bot commands\n🎥 **CONTENT CREATORS** - Showcase, promotion, collaborations\n🖼️ **MEDIA & SHOWCASES** - Screenshots, videos, fan art\n👥 **FRIENDS & NETWORK** - Friends chat, showcase\n🔊 **VOICE CHANNELS** - 4 specialized voice rooms\n🛡️ **STAFF & MODERATION** - Staff tools and logs',
                        inline: false
                    },
                    {
                        name: '🏷️ Default Roles Created',
                        value: '🔴 **Content Creator** - Special creator permissions\n🔵 **Friends** - Friends and network access\n🟣 **Developer** - Game development access\n🟡 **Moderator** - Moderation permissions\n🟢 **Admin** - Full server management',
                        inline: true
                    },
                    {
                        name: '🎆 Community Features',
                        value: '• **Role-Based Permissions** - Organized access control\n• **Content Creator Support** - Dedicated promotion channels\n• **Staff Areas** - Private moderation channels\n• **Game Development Hub** - Collaborate on games\n• **Media Showcases** - Share Section42 content',
                        inline: true
                    },
                    {
                        name: '⚙️ Configuration',
                        value: '• 5 default roles with permissions\n• Role-based channel access\n• Staff-only moderation areas\n• Creator-exclusive promotion channels\n• Rules and server info deployed',
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Section42 community setup by crucifyym`, iconURL: message.author.displayAvatarURL() });
            
            setupMessage.edit({ embeds: [successEmbed] });
            
            try {
                const generalChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '💬│general-chat' && channel.type === ChannelType.GuildText
                );
                
                if (generalChannel) {
                    await generalChannel.send({ embeds: [successEmbed] });
                    console.log('💬 Sent server info to general channel for manual deletion');
                }
            } catch (error) {
                console.error('Error sending message to general channel:', error);
            }
            
            if (isServerSetupChannel) {
                try {
                    setTimeout(async () => {
                        try {
                            await setupChannel.delete();
                            console.log('🗑️ Deleted server-setup channel after successful setup');
                        } catch (deleteError) {
                            console.error('Failed to delete server-setup channel:', deleteError);
                        }
                    }, 3000); // 3 second delay
                } catch (error) {
                    console.error('Error setting up channel deletion:', error);
                }
            }

        } catch (error) {
            console.error('Error during server setup:', error);
            
            try {
                const partialSuccessEmbed = new EmbedBuilder()
                    .setColor('#ff9500')
                    .setTitle('⚠️ Setup Completed with Warnings')
                    .setDescription('Server setup completed but some errors occurred. Check console for details.')
                    .addFields(
                        {
                            name: '📝 Error Details',
                            value: `\`\`\`${error.message}\`\`\``,
                            inline: false
                        }
                    )
                    .setTimestamp();
                setupMessage.edit({ embeds: [partialSuccessEmbed] });
            } catch (editError) {
                console.error('Failed to edit setup message:', editError);
            }
        }
    }
};
