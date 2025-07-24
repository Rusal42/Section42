const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'setup',
    description: 'Sets up a complete server with channels, roles, and categories',
    
    async execute(message) {
        const OWNER_ID = '746068840978448565';
        
        // Check if user is the bot owner
        if (message.author.id !== OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        // Check if bot has permission
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Permission Required')
                .setDescription('I need Administrator permission to set up the server.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const setupEmbed = new EmbedBuilder()
            .setColor('#277571')
            .setTitle('🔧 Server Setup')
            .setDescription('Setting up server... This may take a moment.')
            .setTimestamp();
        const setupMessage = await message.channel.send({ embeds: [setupEmbed] });
        
        // Store reference to current channel (likely server-setup) for deletion later
        const setupChannel = message.channel;
        const isServerSetupChannel = setupChannel.name === 'server-setup';

        try {
            // Create focused role structure with proper hierarchy positioning
            // Create roles without explicit positions to avoid hierarchy conflicts
            const ownerRole = await message.guild.roles.create({
                name: '🔱 Owner',
                color: '#ff0000',
                permissions: [PermissionsBitField.Flags.Administrator],
                hoist: true,
                reason: 'Server setup'
            });

            const adminRole = await message.guild.roles.create({
                name: '👑 Admin',
                color: '#276275',
                permissions: [PermissionsBitField.Flags.Administrator],
                hoist: true,
                reason: 'Server setup'
            });

            const moderatorRole = await message.guild.roles.create({
                name: '🛡️ Moderator',
                color: '#ff6b6b',
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.KickMembers,
                    PermissionsBitField.Flags.MuteMembers,
                    PermissionsBitField.Flags.ManageNicknames
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const section42Role = await message.guild.roles.create({
                name: '🚀 Section 42 Dev',
                color: '#277571',
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.CreatePublicThreads,
                    PermissionsBitField.Flags.CreatePrivateThreads
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const vipRole = await message.guild.roles.create({
                name: '⭐ VIP',
                color: '#ffd700',
                permissions: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.UseExternalEmojis,
                    PermissionsBitField.Flags.AddReactions
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const artistRole = await message.guild.roles.create({
                name: '🎨 Artist',
                color: '#e67e22',
                permissions: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const gamerRole = await message.guild.roles.create({
                name: '🎮 Gamer',
                color: '#9b59b6',
                permissions: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.Connect,
                    PermissionsBitField.Flags.Speak
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const musicLoverRole = await message.guild.roles.create({
                name: '🎵 Music Lover',
                color: '#1abc9c',
                permissions: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.Connect,
                    PermissionsBitField.Flags.Speak
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const memberRole = await message.guild.roles.create({
                name: '👤 Member',
                color: '#b6dbd9',
                hoist: true,
                reason: 'Server setup'
            });

            const newbieRole = await message.guild.roles.create({
                name: '🌱 Newbie',
                color: '#95a5a6',
                permissions: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ],
                hoist: true,
                reason: 'Server setup'
            });

            const botTesterRole = await message.guild.roles.create({
                name: '🤖 Bot Tester',
                color: '#77bfba',
                hoist: false,
                reason: 'Server setup'
            });

            // Create refined category structure
            
            // Welcome Area - @everyone can view this
            const welcomeCategory = await message.guild.channels.create({
                name: '👋 WELCOME',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // Important Section - Member role required
            const importantCategory = await message.guild.channels.create({
                name: '⚠️ IMPORTANT',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Chat Section - Member role required
            const chatCategory = await message.guild.channels.create({
                name: '💬 CHAT',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Roles Area - Member role required
            const rolesCategory = await message.guild.channels.create({
                name: '🏷️ ROLES',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Media Area - Member role required
            const mediaCategory = await message.guild.channels.create({
                name: '📷 MEDIA',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Casino (renamed from Game Bots) - Member role required
            const casinoCategory = await message.guild.channels.create({
                name: '🎰 CASINO',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Bot Feedback (moved below casino) - Member role required
            const feedbackCategory = await message.guild.channels.create({
                name: '📝 BOT FEEDBACK',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Voice Channels - Member role required
            const voiceCategory = await message.guild.channels.create({
                name: '🔊 VOICE CHANNELS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Section 42 Dev (under VCs)
            const section42Category = await message.guild.channels.create({
                name: '🚀 SECTION 42 DEV',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: adminRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: section42Role.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: 'Server setup'
            });

            // Welcome Area Channels
            await message.guild.channels.create({
                name: '👋-welcome',
                type: ChannelType.GuildText,
                parent: welcomeCategory.id,
                topic: 'Welcome new members to the server!',
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '📜-rules',
                type: ChannelType.GuildText,
                parent: welcomeCategory.id,
                topic: 'Server rules - read to gain access to the server',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            // Important Section Channels
            await message.guild.channels.create({
                name: '📢-announcements',
                type: ChannelType.GuildText,
                parent: importantCategory.id,
                topic: 'Important server announcements and updates',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: adminRole.id,
                        allow: [PermissionsBitField.Flags.SendMessages]
                    }
                ],
                reason: 'Server setup'
            });

            // Chat Section Channels
            await message.guild.channels.create({
                name: '💬-general',
                type: ChannelType.GuildText,
                parent: chatCategory.id,
                topic: 'General discussion and conversation',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '🤖-bots',
                type: ChannelType.GuildText,
                parent: chatCategory.id,
                topic: 'Bot commands and interactions',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.UseApplicationCommands
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // Roles Area Channels
            await message.guild.channels.create({
                name: '🏷️-get-roles',
                type: ChannelType.GuildText,
                parent: rolesCategory.id,
                topic: 'React to get your roles!',
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '📜-role-info',
                type: ChannelType.GuildText,
                parent: rolesCategory.id,
                topic: 'Information about available roles',
                reason: 'Server setup'
            });

            // Media Area Channels
            await message.guild.channels.create({
                name: '📷-screenshots',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Share your screenshots and images',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    },
                    {
                        id: newbieRole.id,
                        deny: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: artistRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageMessages,
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.UseExternalEmojis
                        ]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageMessages
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '🎥-videos',
                type: ChannelType.GuildText,
                parent: mediaCategory.id,
                topic: 'Share videos and clips',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    },
                    {
                        id: newbieRole.id,
                        deny: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: artistRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageMessages,
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.UseExternalEmojis
                        ]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageMessages
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // Casino Channels (no leaderboards)
            await message.guild.channels.create({
                name: '🎰-casino-games',
                type: ChannelType.GuildText,
                parent: casinoCategory.id,
                topic: 'Casino and gambling commands',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.UseApplicationCommands,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    },
                    {
                        id: gamerRole.id,
                        allow: [
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.CreatePublicThreads
                        ]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions,
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.ManageThreads
                        ]
                    },
                    {
                        id: newbieRole.id,
                        deny: [
                            PermissionsBitField.Flags.UseApplicationCommands
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // Public Bot Feedback Channels
            await message.guild.channels.create({
                name: '🐛-bug-reports',
                type: ChannelType.GuildText,
                parent: feedbackCategory.id,
                topic: 'Report bugs and issues with the bot',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ],
                        deny: [
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: botTesterRole.id,
                        allow: [
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.ManageThreads,
                            PermissionsBitField.Flags.UseExternalEmojis
                        ]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.UseExternalEmojis
                        ]
                    },
                    {
                        id: newbieRole.id,
                        deny: [
                            PermissionsBitField.Flags.CreatePublicThreads
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '💡-suggestions',
                type: ChannelType.GuildText,
                parent: feedbackCategory.id,
                topic: 'Suggest new features and improvements',
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.AddReactions
                        ],
                        deny: [
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.CreatePublicThreads,
                            PermissionsBitField.Flags.UseExternalEmojis,
                            PermissionsBitField.Flags.AddReactions
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // Section 42 Development Channels (Private)
            await message.guild.channels.create({
                name: '💻-dev-chat',
                type: ChannelType.GuildText,
                parent: section42Category.id,
                topic: 'Section 42 development discussion',
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '🔧-bot-testing',
                type: ChannelType.GuildText,
                parent: section42Category.id,
                topic: 'Test bot features and commands',
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '📄-code-sharing',
                type: ChannelType.GuildText,
                parent: section42Category.id,
                topic: 'Share code snippets and updates',
                reason: 'Server setup'
            });

            // Voice Channels
            await message.guild.channels.create({
                name: '🔊 General',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    },
                    {
                        id: musicLoverRole.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            await message.guild.channels.create({
                name: '🎮 Gaming',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: gamerRole.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            // VIP-only voice channel
            await message.guild.channels.create({
                name: '⭐ VIP Lounge',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect
                        ]
                    },
                    {
                        id: memberRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.Connect]
                    },
                    {
                        id: vipRole.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    },
                    {
                        id: adminRole.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak,
                            PermissionsBitField.Flags.MoveMembers
                        ]
                    },
                    {
                        id: moderatorRole.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ]
                    }
                ],
                reason: 'Server setup'
            });

            const afkChannel = await message.guild.channels.create({
                name: '😴 AFK',
                type: ChannelType.GuildVoice,
                parent: voiceCategory.id,
                reason: 'Server setup'
            });

            // Set AFK channel
            if (afkChannel) {
                await message.guild.setAFKChannel(afkChannel);
                await message.guild.setAFKTimeout(300); // 5 minutes
            }

            // Assign Owner role to the bot owner
            const OWNER_ID = '746068840978448565';
            try {
                const ownerMember = await message.guild.members.fetch(OWNER_ID);
                if (ownerMember) {
                    await ownerMember.roles.add(ownerRole);
                    console.log('🔱 Assigned Owner role to bot owner');
                }
            } catch (error) {
                console.error('Failed to assign Owner role:', error);
            }

            // Automatically deploy rules message to rules channel
            try {
                const rulesChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '📜-rules' && channel.type === ChannelType.GuildText
                );
                
                if (rulesChannel) {
                    // Create the rules embed
                    const rulesEmbed = new EmbedBuilder()
                        .setColor('#276275')
                        .setTitle('📜 Server Rules')
                        .setDescription('Welcome to **Section42**! Please read and accept our rules to gain full access to the server.')
                        .addFields(
                            {
                                name: '1️⃣ Don\'t be a negative Nancy',
                                value: 'Keep the vibes positive and constructive. We\'re here to have a good time!',
                                inline: false
                            },
                            {
                                name: '2️⃣ Keep racial / derogatory slurs to a minimal',
                                value: 'Watch your language. We want everyone to feel welcome here.',
                                inline: false
                            },
                            {
                                name: '3️⃣ Be respectful',
                                value: 'Treat others how you want to be treated. Simple as that.',
                                inline: false
                            },
                            {
                                name: '4️⃣ No NSFW / GORE at all',
                                value: 'Keep it clean. No exceptions.',
                                inline: false
                            },
                            {
                                name: '5️⃣ Whatever the owner / admins say goes',
                                value: 'Staff decisions are final. If you have issues, DM us privately.',
                                inline: false
                            },
                            {
                                name: '6️⃣ Use channels for their corresponding topic',
                                value: 'Media in media channels, bots in bot channels, etc. Keep things organized!',
                                inline: false
                            },
                            {
                                name: '7️⃣ Keep arguments in dms',
                                value: 'Take heated discussions private. Don\'t air your drama in public channels.',
                                inline: false
                            },
                            {
                                name: '8️⃣ No spamming in text channels',
                                value: 'Don\'t flood channels with repetitive messages, emojis, or unnecessary content.',
                                inline: false
                            }
                        )
                        .addFields(
                            {
                                name: '📋 Discord Terms of Service',
                                value: 'All members must follow [Discord\'s Terms of Service](https://discord.com/terms). No exceptions.',
                                inline: false
                            }
                        )
                        .addFields(
                            {
                                name: '⚠️ Rule Violations',
                                value: 'Breaking these rules may result in warnings, timeouts, kicks, or permanent bans depending on severity.',
                                inline: false
                            },
                            {
                                name: '🎯 Ready to Join?',
                                value: 'Click the **Accept Rules** button below to receive the Member role and unlock full server access!',
                                inline: false
                            }
                        )
                        .setThumbnail(message.guild.iconURL())
                        .setTimestamp()
                        .setFooter({ 
                            text: 'By clicking Accept Rules, you agree to follow all server rules', 
                            iconURL: message.guild.iconURL() 
                        });

                    // Create the accept button
                    const acceptButton = new ButtonBuilder()
                        .setCustomId('accept_rules')
                        .setLabel('✅ Accept Rules')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📜');

                    const rulesActionRow = new ActionRowBuilder()
                        .addComponents(acceptButton);

                    // Send the rules message
                    await rulesChannel.send({ 
                        embeds: [rulesEmbed], 
                        components: [rulesActionRow] 
                    });
                    
                    console.log('📜 Automatically deployed rules message to rules channel');
                }
            } catch (error) {
                console.error('Error deploying rules message:', error);
            }

            // Automatically deploy color selection to get-roles channel
            try {
                const getRolesChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '🏷️-get-roles' && channel.type === ChannelType.GuildText
                );
                
                if (getRolesChannel) {
                    // Create color selection embed
                    const colorEmbed = new EmbedBuilder()
                        .setColor('#b6dbd9')
                        .setTitle('🎨 Color Role Selection')
                        .setDescription('Choose a color role to personalize your appearance in the server!')
                        .addFields(
                            {
                                name: '🌈 Available Colors',
                                value: '🔴 **Red** - Bold and passionate\n🟠 **Orange** - Warm and energetic\n🟡 **Yellow** - Bright and cheerful\n🟢 **Green** - Fresh and natural\n🔵 **Blue** - Cool and calm\n🟣 **Purple** - Royal and mysterious\n🟤 **Brown** - Earthy and grounded\n⚫ **Black** - Sleek and elegant\n⚪ **White** - Pure and clean\n🩷 **Pink** - Sweet and playful',
                                inline: false
                            },
                            {
                                name: '💡 How It Works',
                                value: '• Click a color button below to get that color role\n• You can only have one color role at a time\n• Selecting a new color will remove your old one\n• Click "Remove Color" to remove your current color role',
                                inline: false
                            },
                            {
                                name: '⚠️ Note',
                                value: 'You must have the **Member** role (accept the rules first) to use color roles.',
                                inline: false
                            }
                        )
                        .setThumbnail(message.guild.iconURL())
                        .setTimestamp()
                        .setFooter({ text: 'Choose your favorite color!', iconURL: message.guild.iconURL() });

                    // Create color buttons (Row 1)
                    const colorRow1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('color_red')
                                .setLabel('Red')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🔴'),
                            new ButtonBuilder()
                                .setCustomId('color_orange')
                                .setLabel('Orange')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🟠'),
                            new ButtonBuilder()
                                .setCustomId('color_yellow')
                                .setLabel('Yellow')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🟡'),
                            new ButtonBuilder()
                                .setCustomId('color_green')
                                .setLabel('Green')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('🟢'),
                            new ButtonBuilder()
                                .setCustomId('color_blue')
                                .setLabel('Blue')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('🔵')
                        );

                    // Create color buttons (Row 2)
                    const colorRow2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('color_purple')
                                .setLabel('Purple')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🟣'),
                            new ButtonBuilder()
                                .setCustomId('color_brown')
                                .setLabel('Brown')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🟤'),
                            new ButtonBuilder()
                                .setCustomId('color_black')
                                .setLabel('Black')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('⚫'),
                            new ButtonBuilder()
                                .setCustomId('color_white')
                                .setLabel('White')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('⚪'),
                            new ButtonBuilder()
                                .setCustomId('color_pink')
                                .setLabel('Pink')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🩷')
                        );

                    // Create remove button (Row 3)
                    const removeRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('color_remove')
                                .setLabel('Remove Color Role')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️')
                        );

                    // Send the persistent color selection message
                    await getRolesChannel.send({ 
                        embeds: [colorEmbed], 
                        components: [colorRow1, colorRow2, removeRow] 
                    });
                    
                    console.log('🎨 Automatically deployed color selection to get-roles channel');
                }
            } catch (error) {
                console.error('Error deploying color selection:', error);
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('✅ Professional Server Setup Complete!')
                .setDescription('Your organized Discord server with welcome flow and casino features is ready!')
                .addFields(
                    {
                        name: '👥 Created Roles (11)',
                        value: `• ${ownerRole} - Server owner (auto-assigned)\n• ${adminRole} - Full administrator access\n• ${moderatorRole} - Moderation privileges\n• ${section42Role} - Section 42 development team\n• ${vipRole} - VIP member benefits\n• ${artistRole} - Creative community\n• ${gamerRole} - Gaming community\n• ${musicLoverRole} - Music enthusiasts\n• ${memberRole} - Community members\n• ${newbieRole} - New members\n• ${botTesterRole} - Bot testing privileges`,
                        inline: false
                    },
                    {
                        name: '📁 Server Structure (9 Categories)',
                        value: '👋 **WELCOME** - Welcome channel, rules for access\n⚠️ **IMPORTANT** - Admin-only announcements\n💬 **CHAT** - General discussion, bot commands\n🏷️ **ROLES** - Role selection and info\n📷 **MEDIA** - Screenshots and videos\n🎰 **CASINO** - Gambling and casino games\n📝 **BOT FEEDBACK** - Public bug reports and suggestions\n🔊 **VOICE CHANNELS** - 4 voice rooms\n🚀 **SECTION 42 DEV** - Private development area',
                        inline: false
                    },
                    {
                        name: '📊 Server Features',
                        value: '• **Welcome flow** for new members\n• **Casino section** ready for gambling features\n• **Private dev area** for Section 42 team\n• **Public feedback** system for improvements',
                        inline: true
                    },
                    {
                        name: '⚙️ Configuration',
                        value: '• AFK channel configured\n• Admin-only announcements\n• Proper welcome system\n• Casino-ready organization',
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Professional setup by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            setupMessage.edit({ embeds: [successEmbed] });
            
            // Also send the success message to the general channel for manual deletion before release
            try {
                const generalChannel = message.guild.channels.cache.find(channel => 
                    channel.name === '💬-general' && channel.type === ChannelType.GuildText
                );
                
                if (generalChannel) {
                    await generalChannel.send({ embeds: [successEmbed] });
                    console.log('💬 Sent server info to general channel for manual deletion');
                }
            } catch (error) {
                console.error('Error sending message to general channel:', error);
            }
            
            // Delete the server-setup channel if that's where the command was run
            if (isServerSetupChannel) {
                try {
                    // Wait a moment for the success message to be seen
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
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Setup Failed')
                .setDescription('An error occurred during server setup. Please check my permissions and try again.')
                .setTimestamp();
            setupMessage.edit({ embeds: [errorEmbed] });
        }
    }
};
