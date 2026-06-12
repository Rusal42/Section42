const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOCKDOWN_FILE = path.join(__dirname, '..', 'data', 'lockdown.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(LOCKDOWN_FILE)) {
    fs.writeFileSync(LOCKDOWN_FILE, JSON.stringify({}, null, 2));
}

function loadLockdownData() {
    try {
        const data = fs.readFileSync(LOCKDOWN_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveLockdownData(data) {
    fs.writeFileSync(LOCKDOWN_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'lockdown',
    description: 'Lock down server channels to prevent spam',
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock down server channels to prevent spam')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start lockdown on channels')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of lockdown')
                        .addChoices(
                            { name: 'All Channels', value: 'all' },
                            { name: 'Text Only', value: 'text' },
                            { name: 'Voice Only', value: 'voice' },
                            { name: 'Specific Category', value: 'category' }
                        )
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category to lock (only for category type)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for lockdown')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End lockdown and restore permissions')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for ending lockdown')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current lockdown status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('quarantine')
                .setDescription('Quarantine a hacked account')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to quarantine')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for quarantine')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'start') {
                await this.handleStart(interaction);
            } else if (subcommand === 'end') {
                await this.handleEnd(interaction);
            } else if (subcommand === 'status') {
                await this.handleStatus(interaction);
            } else if (subcommand === 'quarantine') {
                await this.handleQuarantine(interaction);
            }
        } catch (error) {
            console.error('Lockdown error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    async handleStart(interaction) {
        const type = interaction.options.getString('type');
        const category = interaction.options.getChannel('category');
        const reason = interaction.options.getString('reason') || 'Security lockdown';

        if (type === 'category' && !category) {
            return interaction.reply({
                content: 'You must specify a category for category lockdown!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const lockdownData = loadLockdownData();
        const guildId = interaction.guild.id;
        
        // Store original permissions
        if (!lockdownData[guildId]) {
            lockdownData[guildId] = {
                channels: {},
                quarantinedUsers: {},
                active: false
            };
        }

        let channelsToLock = [];
        
        if (type === 'all') {
            channelsToLock = interaction.guild.channels.cache.filter(c => 
                c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice
            );
        } else if (type === 'text') {
            channelsToLock = interaction.guild.channels.cache.filter(c => 
                c.type === ChannelType.GuildText
            );
        } else if (type === 'voice') {
            channelsToLock = interaction.guild.channels.cache.filter(c => 
                c.type === ChannelType.GuildVoice
            );
        } else if (type === 'category') {
            channelsToLock = interaction.guild.channels.cache.filter(c => 
                c.parentId === category.id
            );
        }

        let lockedCount = 0;
        const errors = [];

        for (const channel of channelsToLock) {
            try {
                // Store original permissions for @everyone
                const everyoneRole = interaction.guild.roles.everyone;
                const originalPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
                
                lockdownData[guildId].channels[channel.id] = {
                    type: channel.type,
                    originalPerms: originalPerms ? originalPerms.serialize() : null
                };

                // Lock the channel
                if (channel.type === ChannelType.GuildText) {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicPoll: false,
                        SendMessagesInThreads: false
                    });
                } else if (channel.type === ChannelType.GuildVoice) {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        Connect: false,
                        Speak: false
                    });
                }

                lockedCount++;
            } catch (error) {
                errors.push(`${channel.name}: ${error.message}`);
            }
        }

        lockdownData[guildId].active = true;
        lockdownData[guildId].reason = reason;
        lockdownData[guildId].startedBy = interaction.user.id;
        lockdownData[guildId].startedAt = Date.now();
        saveLockdownData(lockdownData);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔒 LOCKDOWN INITIATED')
            .setDescription(
                `**Type:** ${type}\n` +
                `**Channels Locked:** ${lockedCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Started by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        if (errors.length > 0) {
            embed.addFields({
                name: '⚠️ Errors',
                value: errors.slice(0, 5).join('\n'),
                inline: false
            });
        }

        await interaction.followUp({ embeds: [embed] });

        // Send announcement to announcements channel if it exists
        const announcementsChannel = interaction.guild.channels.cache.find(c => 
            c.name.toLowerCase().includes('announcements') && c.type === ChannelType.GuildText
        );
        
        if (announcementsChannel) {
            const announceEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 SERVER LOCKDOWN')
                .setDescription(
                    `**All channels have been locked** due to security concerns.\n\n` +
                    `**Reason:** ${reason}\n\n` +
                    `Please wait for further instructions from staff.`
                )
                .setTimestamp();
            
            await announcementsChannel.send({ embeds: [announceEmbed] });
        }
    },

    async handleEnd(interaction) {
        const reason = interaction.options.getString('reason') || 'Lockdown lifted';

        await interaction.deferReply();

        const lockdownData = loadLockdownData();
        const guildId = interaction.guild.id;
        
        if (!lockdownData[guildId] || !lockdownData[guildId].active) {
            return interaction.followUp({
                content: 'No active lockdown to end!',
                ephemeral: true
            });
        }

        let restoredCount = 0;
        const errors = [];

        for (const [channelId, channelData] of Object.entries(lockdownData[guildId].channels)) {
            try {
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) continue;

                const everyoneRole = interaction.guild.roles.everyone;

                if (channelData.originalPerms) {
                    // Restore original permissions
                    await channel.permissionOverwrites.edit(everyoneRole, channelData.originalPerms);
                } else {
                    // Remove the override if there were no original permissions
                    await channel.permissionOverwrites.delete(everyoneRole);
                }

                restoredCount++;
            } catch (error) {
                errors.push(`Channel ${channelId}: ${error.message}`);
            }
        }

        // Clear lockdown data
        delete lockdownData[guildId];
        saveLockdownData(lockdownData);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔓 LOCKDOWN ENDED')
            .setDescription(
                `**Channels Restored:** ${restoredCount}\n` +
                `**Reason:** ${reason}\n` +
                `**Ended by:** ${interaction.user.tag}`
            )
            .setTimestamp();

        if (errors.length > 0) {
            embed.addFields({
                name: '⚠️ Errors',
                value: errors.slice(0, 5).join('\n'),
                inline: false
            });
        }

        await interaction.followUp({ embeds: [embed] });

        // Send announcement to announcements channel if it exists
        const announcementsChannel = interaction.guild.channels.cache.find(c => 
            c.name.toLowerCase().includes('announcements') && c.type === ChannelType.GuildText
        );
        
        if (announcementsChannel) {
            const announceEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ LOCKDOWN LIFTED')
                .setDescription(
                    `**Server lockdown has been lifted.**\n\n` +
                    `**Reason:** ${reason}\n\n` +
                    `Normal channel access has been restored.`
                )
                .setTimestamp();
            
            await announcementsChannel.send({ embeds: [announceEmbed] });
        }
    },

    async handleStatus(interaction) {
        const lockdownData = loadLockdownData();
        const guildId = interaction.guild.id;
        
        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🔒 Lockdown Status');

        if (!lockdownData[guildId] || !lockdownData[guildId].active) {
            embed.setDescription('✅ No active lockdown')
                .setColor('#00ff00');
        } else {
            const data = lockdownData[guildId];
            const lockedChannels = Object.keys(data.channels).length;
            const quarantinedUsers = Object.keys(data.quarantinedUsers || {}).length;
            const startedAt = new Date(data.startedAt).toLocaleString();
            
            embed.setDescription('🚨 **ACTIVE LOCKDOWN**')
                .addFields(
                    { name: 'Reason', value: data.reason, inline: false },
                    { name: 'Started By', value: `<@${data.startedBy}>`, inline: true },
                    { name: 'Started At', value: startedAt, inline: true },
                    { name: 'Locked Channels', value: lockedChannels.toString(), inline: true },
                    { name: 'Quarantined Users', value: quarantinedUsers.toString(), inline: true }
                );
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleQuarantine(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Suspected compromised account';

        await interaction.deferReply();

        const lockdownData = loadLockdownData();
        const guildId = interaction.guild.id;
        
        if (!lockdownData[guildId]) {
            lockdownData[guildId] = {
                channels: {},
                quarantinedUsers: {},
                active: false
            };
        }

        // Store original roles and remove them
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.followUp({
                content: 'User not found in this server!',
                ephemeral: true
            });
        }

        // Store original roles
        lockdownData[guildId].quarantinedUsers[user.id] = {
            originalRoles: member.roles.cache.map(r => r.id).filter(id => id !== interaction.guild.id),
            quarantinedAt: Date.now(),
            quarantinedBy: interaction.user.id,
            reason
        };

        // Remove all roles except @everyone
        await member.roles.set([], reason);

        // Create quarantine role if it doesn't exist
        let quarantineRole = interaction.guild.roles.cache.find(r => r.name === 'Quarantined');
        if (!quarantineRole) {
            quarantineRole = await interaction.guild.roles.create({
                name: 'Quarantined',
                color: '#8B0000',
                reason: 'Quarantine role for compromised accounts'
            });
        }

        // Assign quarantine role with no permissions
        await member.roles.add(quarantineRole, reason);

        // Update quarantine role permissions (restrict all channels)
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

        saveLockdownData(lockdownData);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 USER QUARANTINED')
            .setDescription(
                `**User:** ${user.tag}\n` +
                `**User ID:** ${user.id}\n` +
                `**Reason:** ${reason}\n` +
                `**Quarantined by:** ${interaction.user.tag}\n\n` +
                `All roles removed and user restricted.`
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });

        // Log to staff channel
        const staffChannel = interaction.guild.channels.cache.find(c => 
            c.name.toLowerCase().includes('staff') && c.type === ChannelType.GuildText
        );
        
        if (staffChannel) {
            await staffChannel.send({ embeds: [embed] });
        }
    }
};
