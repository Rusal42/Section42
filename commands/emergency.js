const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'emergency',
    description: 'Emergency server lockdown - one command solution',
    data: new SlashCommandBuilder()
        .setName('emergency')
        .setDescription('Emergency server lockdown - one command solution')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Emergency action to take')
                .addChoices(
                    { name: '🔒 Lock Everything', value: 'lock_all' },
                    { name: '🔓 Unlock Everything', value: 'unlock_all' },
                    { name: '🚨 Lock + Announce', value: 'lock_announce' },
                    { name: '🛡️ Lock + Quarantine Spammer', value: 'lock_quarantine' }
                )
                .setRequired(true))
        .addUserOption(option =>
            option.setName('spammer')
                .setDescription('User to quarantine (for lock_quarantine)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Emergency reason')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executeSlash(interaction) {
        const action = interaction.options.getString('action');
        const spammer = interaction.options.getUser('spammer');
        const reason = interaction.options.getString('reason') || 'Emergency security action';

        if (action === 'lock_quarantine' && !spammer) {
            return interaction.reply({
                content: 'You must specify a user to quarantine for lock_quarantine action!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            if (action === 'lock_all') {
                await this.lockAll(interaction, reason);
            } else if (action === 'unlock_all') {
                await this.unlockAll(interaction, reason);
            } else if (action === 'lock_announce') {
                await this.lockAndAnnounce(interaction, reason);
            } else if (action === 'lock_quarantine') {
                await this.lockAndQuarantine(interaction, spammer, reason);
            }
        } catch (error) {
            console.error('Emergency command error:', error);
            await interaction.followUp({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    },

    async lockAll(interaction, reason) {
        const everyoneRole = interaction.guild.roles.everyone;
        let lockedCount = 0;

        // Lock all text channels
        const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        for (const channel of textChannels) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false,
                    CreatePublicPoll: false,
                    SendMessagesInThreads: false
                });
                lockedCount++;
            } catch (error) {
                console.log(`Failed to lock ${channel.name}: ${error.message}`);
            }
        }

        // Lock all voice channels
        const voiceChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
        for (const channel of voiceChannels) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    Connect: false,
                    Speak: false
                });
                lockedCount++;
            } catch (error) {
                console.log(`Failed to lock ${channel.name}: ${error.message}`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 EMERGENCY LOCKDOWN')
            .setDescription(
                `**All channels locked immediately!**\n\n` +
                `**Channels Locked:** ${lockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Action by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    },

    async unlockAll(interaction, reason) {
        const everyoneRole = interaction.guild.roles.everyone;
        let unlockedCount = 0;

        // Get all channels and remove lockdown overrides
        const allChannels = interaction.guild.channels.cache.filter(c => 
            c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice
        );

        for (const channel of allChannels) {
            try {
                // Remove the @everyone override entirely
                await channel.permissionOverwrites.delete(everyoneRole);
                unlockedCount++;
            } catch (error) {
                // Might not exist, that's okay
                console.log(`No override to remove for ${channel.name}`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ EMERGENCY UNLOCK')
            .setDescription(
                `**All channels unlocked!**\n\n` +
                `**Channels Restored:** ${unlockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Action by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    },

    async lockAndAnnounce(interaction, reason) {
        // First lock everything
        await this.lockAll(interaction, reason);

        // Then send announcements
        const announcementsChannel = interaction.guild.channels.cache.find(c => 
            c.name.toLowerCase().includes('announcements') && c.type === ChannelType.GuildText
        );

        if (announcementsChannel) {
            const announceEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 EMERGENCY LOCKDOWN ANNOUNCEMENT')
                .setDescription(
                    `**SERVER IS UNDER EMERGENCY LOCKDOWN**\n\n` +
                    `**Reason:** ${reason}\n\n` +
                    `All channels have been locked for security.\n` +
                    `Please wait for staff instructions.\n\n` +
                    `This is a temporary security measure.`
                )
                .setTimestamp();

            await announcementsChannel.send({ embeds: [announceEmbed] });
        }

        // Also try to send to general chat
        const generalChannel = interaction.guild.channels.cache.find(c => 
            (c.name.toLowerCase().includes('general') || c.name.toLowerCase().includes('chat')) && 
            c.type === ChannelType.GuildText
        );

        if (generalChannel) {
            await generalChannel.send({
                content: '@everyone',
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚨 EMERGENCY LOCKDOWN')
                    .setDescription('Server is under emergency lockdown. All channels locked. Please wait for staff instructions.')
                    .setTimestamp()
                ]
            });
        }
    },

    async lockAndQuarantine(interaction, spammer, reason) {
        // Lock everything first
        await this.lockAll(interaction, reason);

        // Then quarantine the spammer
        try {
            const member = await interaction.guild.members.fetch(spammer.id);
            if (member) {
                // Store original roles
                const originalRoles = member.roles.cache.map(r => r.id).filter(id => id !== interaction.guild.id);
                
                // Remove all roles except @everyone
                await member.roles.set([], `Emergency quarantine: ${reason}`);

                // Create or get quarantine role
                let quarantineRole = interaction.guild.roles.cache.find(r => r.name === 'Quarantined');
                if (!quarantineRole) {
                    quarantineRole = await interaction.guild.roles.create({
                        name: 'Quarantined',
                        color: '#8B0000',
                        reason: 'Emergency quarantine role'
                    });
                }

                // Assign quarantine role
                await member.roles.add(quarantineRole, `Emergency quarantine: ${reason}`);

                // Update quarantine role permissions
                const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
                const voiceChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);

                for (const channel of textChannels) {
                    await channel.permissionOverwrites.edit(quarantineRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicPoll: false,
                        SendMessagesInThreads: false,
                        ViewChannel: false
                    });
                }

                for (const channel of voiceChannels) {
                    await channel.permissionOverwrites.edit(quarantineRole, {
                        Connect: false,
                        Speak: false,
                        ViewChannel: false
                    });
                }

                // Send quarantine notification
                const staffChannel = interaction.guild.channels.cache.find(c => 
                    c.name.toLowerCase().includes('staff') && c.type === ChannelType.GuildText
                );

                if (staffChannel) {
                    const quarantineEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🚨 EMERGENCY QUARANTINE')
                        .setDescription(
                            `**User Quarantined:** ${spammer.tag}\n` +
                            `**User ID:** ${spammer.id}\n` +
                            `**Reason:** ${reason}\n` +
                            `**Roles Removed:** ${originalRoles.length}\n\n` +
                            `Server is locked and user is quarantined.`
                        )
                        .setTimestamp();

                    await staffChannel.send({ content: '@here', embeds: [quarantineEmbed] });
                }
            }
        } catch (error) {
            console.error('Error quarantining user:', error);
        }

        // Send final confirmation
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 EMERGENCY LOCKDOWN + QUARANTINE')
            .setDescription(
                `**Server locked and user quarantined!**\n\n` +
                `**Quarantined User:** ${spammer.tag}\n` +
                `**Reason:** ${reason}\n` +
                `**Action by:** ${interaction.user.tag}\n\n` +
                `All channels locked and spammer restricted.`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    }
};
