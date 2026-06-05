const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const QUARANTINE_FILE = path.join(__dirname, '..', 'data', 'quarantinedUsers.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(QUARANTINE_FILE)) {
    fs.writeFileSync(QUARANTINE_FILE, JSON.stringify({}, null, 2));
}

function loadQuarantineData() {
    try {
        const data = fs.readFileSync(QUARANTINE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveQuarantineData(data) {
    fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'quarantine',
    description: 'Manage quarantined users (hacked accounts)',
    data: new SlashCommandBuilder()
        .setName('quarantine')
        .setDescription('Manage quarantined users (hacked accounts)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Quarantine a user (hacked account)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to quarantine')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for quarantine')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove quarantine from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to unquarantine')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing quarantine')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all quarantined users'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get info about a quarantined user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'add') {
                await this.handleAdd(interaction);
            } else if (subcommand === 'remove') {
                await this.handleRemove(interaction);
            } else if (subcommand === 'list') {
                await this.handleList(interaction);
            } else if (subcommand === 'info') {
                await this.handleInfo(interaction);
            }
        } catch (error) {
            console.error('Quarantine command error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    async handleAdd(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Suspected compromised account';

        if (user.bot) {
            return interaction.reply({
                content: 'You cannot quarantine a bot!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const quarantineData = loadQuarantineData();
        const guildId = interaction.guild.id;

        if (!quarantineData[guildId]) {
            quarantineData[guildId] = {};
        }

        if (quarantineData[guildId][user.id]) {
            return interaction.followUp({
                content: 'This user is already quarantined!',
                ephemeral: true
            });
        }

        // Get the member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.followUp({
                content: 'User not found in this server!',
                ephemeral: true
            });
        }

        // Store original roles and info
        quarantineData[guildId][user.id] = {
            originalRoles: member.roles.cache.map(r => r.id).filter(id => id !== interaction.guild.id),
            quarantinedAt: Date.now(),
            quarantinedBy: interaction.user.id,
            reason,
            originalNickname: member.nickname || null,
            originalVoiceState: member.voice ? {
                channelId: member.voice.channelId,
                selfMute: member.voice.selfMute,
                selfDeaf: member.voice.selfDeaf
            } : null
        };

        saveQuarantineData(quarantineData);

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

        // Set quarantine role permissions
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

        // Assign quarantine role
        await member.roles.add(quarantineRole, reason);

        // Kick from voice if in one
        if (member.voice.channel) {
            await member.voice.disconnect('Quarantine - moved to voice isolation');
        }

        // Set quarantine nickname
        await member.setNickname(`⚠️ QUARANTINED ⚠️`, reason).catch(() => {});

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 User Quarantined')
            .setDescription(
                `**User:** ${user.tag}\n` +
                `**User ID:** ${user.id}\n` +
                `**Reason:** ${reason}\n` +
                `**Quarantined by:** ${interaction.user.tag}\n\n` +
                `All roles removed and user restricted.`
            )
            .addFields(
                { name: 'Original Roles', value: `${quarantineData[guildId][user.id].originalRoles.length} roles removed`, inline: true },
                { name: 'Voice Status', value: member.voice.channel ? 'Disconnected from voice' : 'Not in voice', inline: true },
                { name: 'Nickname', value: 'Changed to ⚠️ QUARANTINED ⚠️', inline: true }
            )
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });

        // Log to staff channel
        const staffChannel = interaction.guild.channels.cache.find(c => 
            c.name.toLowerCase().includes('staff') && c.type === ChannelType.GuildText
        );
        
        if (staffChannel) {
            await staffChannel.send({ content: '@here', embeds: [embed] });
        }
    },

    async handleRemove(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Quarantine lifted';

        await interaction.deferReply();

        const quarantineData = loadQuarantineData();
        const guildId = interaction.guild.id;

        if (!quarantineData[guildId] || !quarantineData[guildId][user.id]) {
            return interaction.followUp({
                content: 'This user is not quarantined!',
                ephemeral: true
            });
        }

        const quarantineInfo = quarantineData[guildId][user.id];

        // Get the member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.followUp({
                content: 'User not found in this server!',
                ephemeral: true
            });
        }

        // Restore original roles
        const rolesToRestore = [];
        for (const roleId of quarantineInfo.originalRoles) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role) rolesToRestore.push(role);
        }

        await member.roles.set(rolesToRestore, reason);

        // Remove quarantine role
        const quarantineRole = interaction.guild.roles.cache.find(r => r.name === 'Quarantined');
        if (quarantineRole) {
            await member.roles.remove(quarantineRole, reason);
        }

        // Restore nickname
        if (quarantineInfo.originalNickname) {
            await member.setNickname(quarantineInfo.originalNickname, reason).catch(() => {});
        } else {
            await member.setNickname(null, reason).catch(() => {});
        }

        // Remove from quarantine data
        delete quarantineData[guildId][user.id];
        saveQuarantineData(quarantineData);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ User Unquarantined')
            .setDescription(
                `**User:** ${user.tag}\n` +
                `**User ID:** ${user.id}\n` +
                `**Reason:** ${reason}\n` +
                `**Unquarantined by:** ${interaction.user.tag}\n\n` +
                `Original roles and access restored.`
            )
            .addFields(
                { name: 'Roles Restored', value: `${rolesToRestore.length} roles restored`, inline: true },
                { name: 'Nickname', value: quarantineInfo.originalNickname || 'Reset to default', inline: true },
                { name: 'Quarantine Duration', value: this.formatDuration(Date.now() - quarantineInfo.quarantinedAt), inline: true }
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
    },

    async handleList(interaction) {
        const quarantineData = loadQuarantineData();
        const guildId = interaction.guild.id;

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🚨 Quarantined Users');

        if (!quarantineData[guildId] || Object.keys(quarantineData[guildId]).length === 0) {
            embed.setDescription('✅ No users are currently quarantined')
                .setColor('#00ff00');
        } else {
            const quarantinedList = Object.entries(quarantineData[guildId]).map(([userId, data]) => {
                const quarantinedBy = `<@${data.quarantinedBy}>`;
                const quarantinedAt = new Date(data.quarantinedAt).toLocaleString();
                const duration = this.formatDuration(Date.now() - data.quarantinedAt);
                
                return `**<@${userId}>** - ${data.reason}\n└ Quarantined by ${quarantinedBy} • ${duration} ago`;
            });

            embed.setDescription(`🚨 ${Object.keys(quarantineData[guildId]).length} user(s) quarantined`)
                .addFields({ name: 'Quarantined Users', value: quarantinedList.join('\n\n') });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleInfo(interaction) {
        const user = interaction.options.getUser('user');
        const quarantineData = loadQuarantineData();
        const guildId = interaction.guild.id;

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`🔍 Quarantine Info: ${user.tag}`);

        if (!quarantineData[guildId] || !quarantineData[guildId][user.id]) {
            embed.setDescription('✅ This user is not quarantined')
                .setColor('#00ff00');
        } else {
            const data = quarantineData[guildId][user.id];
            const quarantinedBy = `<@${data.quarantinedBy}>`;
            const quarantinedAt = new Date(data.quarantinedAt).toLocaleString();
            const duration = this.formatDuration(Date.now() - data.quarantinedAt);
            
            embed.setDescription('🚨 **USER IS QUARANTINED**')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
                    { name: 'Reason', value: data.reason, inline: false },
                    { name: 'Quarantined By', value: quarantinedBy, inline: true },
                    { name: 'Quarantined At', value: quarantinedAt, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Original Roles', value: `${data.originalRoles.length} roles removed`, inline: true },
                    { name: 'Original Nickname', value: data.originalNickname || 'None', inline: true }
                );
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};
