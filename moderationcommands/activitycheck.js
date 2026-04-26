const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Store active activity checks
const activeChecks = new Map();

module.exports = {
    name: 'activitycheck',
    description: 'Check user activity by requiring reactions within a time limit',
    data: new SlashCommandBuilder()
        .setName('activitycheck')
        .setDescription('Check user activity by requiring reactions within a time limit')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start an activity check')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title for the activity check message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description text')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Time limit (e.g., 30m, 1h, 2h, 1d)')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('check_role')
                        .setDescription('Role to check (affects users with this role)')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('remove_role')
                        .setDescription('Role to remove if they dont react (optional, defaults to check_role)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('reward_role')
                        .setDescription('Role to give to users who react in time (optional)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Custom emoji to react with (default: white_check_mark)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an active activity check')
                .addStringOption(option =>
                    option.setName('check_id')
                        .setDescription('The check ID (found in the original message)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active activity checks'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Roles** permission to use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        if (args.length < 2) {
            const usageEmbed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Activity Check Usage')
                .setDescription(
                    '`!activitycheck start <duration> <role> <title|description>`\n' +
                    '`!activitycheck cancel <check_id>`\n' +
                    '`!activitycheck list`\n\n' +
                    'Duration: 30m, 1h, 2h, 1d, etc.'
                )
                .setTimestamp();
            return message.channel.send({ embeds: [usageEmbed] });
        }

        const subcommand = args[0].toLowerCase();

        if (subcommand === 'list') {
            return this.handleList(message);
        }

        if (subcommand === 'cancel') {
            if (!args[1]) {
                return message.channel.send('Usage: `!activitycheck cancel <check_id>`');
            }
            return this.handleCancel(message, args[1]);
        }

        if (subcommand === 'start') {
            const durationStr = args[1];
            const roleMention = args[2];
            const restText = args.slice(3).join(' ');
            
            if (!durationStr || !roleMention || !restText) {
                return message.channel.send('Usage: `!activitycheck start <duration> <@role> <title|description>`');
            }

            const [title, description] = restText.includes('|') 
                ? restText.split('|').map(s => s.trim()) 
                : ['Activity Check', restText];

            return this.handleStart(message, {
                title,
                description,
                duration: durationStr,
                checkRole: roleMention.replace(/[<@&>]/g, ''),
                removeRole: null,
                rewardRole: null,
                emoji: '✅'
            });
        }

        return message.channel.send('Invalid subcommand. Use `start`, `cancel`, or `list`.');
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'list') {
                await this.handleList(interaction);
            } else if (subcommand === 'cancel') {
                const checkId = interaction.options.getString('check_id');
                await this.handleCancel(interaction, checkId);
            } else if (subcommand === 'start') {
                const durationStr = interaction.options.getString('duration');
                const duration = this.parseDuration(durationStr);

                if (!duration) {
                    return interaction.reply({
                        content: 'Invalid duration format. Use: 30m, 1h, 2h, 1d',
                        ephemeral: true
                    });
                }

                const options = {
                    title: interaction.options.getString('title'),
                    description: interaction.options.getString('description'),
                    duration: durationStr,
                    durationMs: duration,
                    checkRole: interaction.options.getRole('check_role'),
                    removeRole: interaction.options.getRole('remove_role'),
                    rewardRole: interaction.options.getRole('reward_role'),
                    emoji: interaction.options.getString('emoji') || '✅'
                };

                await this.handleStart(interaction, options);
            }
        } catch (error) {
            console.error('Activity check error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    parseDuration(input) {
        const match = input.match(/^(\d+)([smhd])$/i);
        if (!match) return null;

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return null;
        }
    },

    generateCheckId() {
        return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    async handleStart(interactionOrMessage, options) {
        const isSlash = interactionOrMessage.isCommand?.() || interactionOrMessage.isChatInputCommand?.();
        const channel = interactionOrMessage.channel;
        const guild = interactionOrMessage.guild;

        // Resolve roles if needed
        let checkRole = options.checkRole;
        let removeRole = options.removeRole;
        let rewardRole = options.rewardRole;

        if (!isSlash && typeof checkRole === 'string') {
            checkRole = guild.roles.cache.get(checkRole) || 
                       guild.roles.cache.find(r => r.name === checkRole) ||
                       guild.roles.cache.find(r => r.name.toLowerCase().includes(checkRole.toLowerCase()));
        }

        if (!checkRole) {
            const errorMsg = 'Could not find the check role. Make sure it exists.';
            if (isSlash) {
                return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            }
            return channel.send(errorMsg);
        }

        // Default remove role to check role if not specified
        removeRole = removeRole || checkRole;

        // Parse duration for prefix command
        let durationMs = options.durationMs;
        if (!durationMs) {
            durationMs = this.parseDuration(options.duration);
            if (!durationMs) {
                const errorMsg = 'Invalid duration format. Use: 30m, 1h, 2h, 1d';
                if (isSlash) {
                    return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
                }
                return channel.send(errorMsg);
            }
        }

        const checkId = this.generateCheckId();
        const endTime = Date.now() + durationMs;
        const endTimestamp = Math.floor(endTime / 1000);

        // Create the check embed
        const checkEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(options.title)
            .setDescription(
                `${options.description}\n\n` +
                `React with ${options.emoji} within <t:${endTimestamp}:R> to keep your roles!\n\n` +
                `**Affected Role:** ${checkRole.name}\n` +
                `**Time Limit:** ${options.duration}\n` +
                `**Check ID:** \`${checkId}\``
            )
            .setFooter({ text: 'React to confirm your activity' })
            .setTimestamp();

        // Send the message
        let checkMessage;
        if (isSlash) {
            await interactionOrMessage.deferReply();
            checkMessage = await channel.send({ embeds: [checkEmbed] });
            await interactionOrMessage.deleteReply();
        } else {
            checkMessage = await channel.send({ embeds: [checkEmbed] });
        }

        // Add reaction
        await checkMessage.react(options.emoji);

        // Store check data
        const checkData = {
            checkId,
            messageId: checkMessage.id,
            channelId: channel.id,
            guildId: guild.id,
            checkRoleId: checkRole.id,
            removeRoleId: removeRole.id,
            rewardRoleId: rewardRole?.id || null,
            emoji: options.emoji,
            endTime,
            startedBy: isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id,
            reactedUsers: new Set(),
            ended: false
        };

        activeChecks.set(checkId, checkData);

        // Set up the collector
        const filter = (reaction, user) => {
            return reaction.emoji.name === options.emoji && !user.bot;
        };

        const collector = checkMessage.createReactionCollector({
            filter,
            time: durationMs
        });

        collector.on('collect', async (reaction, user) => {
            try {
                const member = await guild.members.fetch(user.id);
                
                // Only track users who have the check role
                if (member.roles.cache.has(checkRole.id)) {
                    checkData.reactedUsers.add(user.id);
                    
                    // Give reward role if specified
                    if (rewardRole && !member.roles.cache.has(rewardRole.id)) {
                        await member.roles.add(rewardRole);
                    }
                }
            } catch (error) {
                console.error('Error processing reaction:', error);
            }
        });

        collector.on('end', async () => {
            if (checkData.ended) return;
            await this.endCheck(checkId);
        });

        // Confirmation
        const confirmEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Activity Check Started')
            .setDescription(
                `Check ID: \`${checkId}\`\n` +
                `Ends: <t:${endTimestamp}:R>\n` +
                `Will remove **${removeRole.name}** from inactive members with **${checkRole.name}**`
            )
            .setTimestamp();

        if (isSlash) {
            await interactionOrMessage.followUp({
                embeds: [confirmEmbed],
                ephemeral: true
            });
        }
    },

    async handleCancel(interactionOrMessage, checkId) {
        const checkData = activeChecks.get(checkId);
        
        if (!checkData) {
            const errorMsg = `No active check found with ID: \`${checkId}\``;
            if (interactionOrMessage.isCommand?.() || interactionOrMessage.isChatInputCommand?.()) {
                return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            }
            return interactionOrMessage.channel.send(errorMsg);
        }

        checkData.ended = true;
        activeChecks.delete(checkId);

        // Update the original message
        try {
            const guild = interactionOrMessage.guild;
            const channel = await guild.channels.fetch(checkData.channelId);
            const message = await channel.messages.fetch(checkData.messageId);
            
            const cancelledEmbed = EmbedBuilder.from(message.embeds[0])
                .setColor('#95a5a6')
                .setTitle(message.embeds[0].title + ' (Cancelled)')
                .setFooter({ text: 'This check was cancelled by a moderator' });
            
            await message.edit({ embeds: [cancelledEmbed] });
        } catch (error) {
            console.error('Could not update check message:', error);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Activity Check Cancelled')
            .setDescription(`Check \`${checkId}\` has been cancelled. No roles will be removed.`)
            .setTimestamp();

        if (interactionOrMessage.isCommand?.() || interactionOrMessage.isChatInputCommand?.()) {
            await interactionOrMessage.reply({ embeds: [successEmbed], ephemeral: true });
        } else {
            await interactionOrMessage.channel.send({ embeds: [successEmbed] });
        }
    },

    async handleList(interactionOrMessage) {
        if (activeChecks.size === 0) {
            const msg = 'No active activity checks.';
            if (interactionOrMessage.isCommand?.() || interactionOrMessage.isChatInputCommand?.()) {
                return interactionOrMessage.reply({ content: msg, ephemeral: true });
            }
            return interactionOrMessage.channel.send(msg);
        }

        const listEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Active Activity Checks')
            .setDescription(`Found ${activeChecks.size} active check(s):`)
            .setTimestamp();

        for (const [checkId, data] of activeChecks) {
            const timeLeft = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
            const timeText = timeLeft > 0 ? `<t:${Math.floor(data.endTime / 1000)}:R>` : 'Ending soon';
            
            listEmbed.addFields({
                name: `\`${checkId}\``,
                value: 
                    `Role: <@&${data.checkRoleId}>\n` +
                    `Reacted: ${data.reactedUsers.size} users\n` +
                    `Ends: ${timeText}`,
                inline: true
            });
        }

        if (interactionOrMessage.isCommand?.() || interactionOrMessage.isChatInputCommand?.()) {
            await interactionOrMessage.reply({ embeds: [listEmbed], ephemeral: true });
        } else {
            await interactionOrMessage.channel.send({ embeds: [listEmbed] });
        }
    },

    async endCheck(checkId) {
        const checkData = activeChecks.get(checkId);
        if (!checkData || checkData.ended) return;

        checkData.ended = true;
        
        try {
            const guild = await global.client.guilds.fetch(checkData.guildId);
            const channel = await guild.channels.fetch(checkData.channelId);
            const message = await channel.messages.fetch(checkData.messageId);

            // Get all members with the check role
            const members = await guild.members.fetch();
            const affectedMembers = [];
            const sparedMembers = [];

            for (const [, member] of members) {
                // Skip bots
                if (member.user.bot) continue;
                
                // Only check members with the check role
                if (!member.roles.cache.has(checkData.checkRoleId)) continue;

                // Check if they reacted
                if (checkData.reactedUsers.has(member.id)) {
                    sparedMembers.push(member);
                } else {
                    affectedMembers.push(member);
                    
                    // Remove the role
                    try {
                        await member.roles.remove(checkData.removeRoleId);
                    } catch (error) {
                        console.error(`Could not remove role from ${member.user.tag}:`, error);
                    }
                }
            }

            // Update the message
            const endedEmbed = EmbedBuilder.from(message.embeds[0])
                .setColor('#e74c3c')
                .setTitle(message.embeds[0].title + ' (Ended)')
                .setDescription(
                    message.embeds[0].description.split('React with')[0] +
                    `**Check Complete**\n` +
                    `Active members: ${sparedMembers.length}\n` +
                    `Inactive (role removed): ${affectedMembers.length}`
                )
                .setFooter({ text: 'This activity check has ended' });

            await message.edit({ embeds: [endedEmbed] });

            // Send summary to channel
            const summaryEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('Activity Check Results')
                .setDescription(
                    `Check ID: \`${checkId}\`\n\n` +
                    `Active members (kept role): **${sparedMembers.length}**\n` +
                    `Inactive members (removed role): **${affectedMembers.length}**`
                )
                .setTimestamp();

            await channel.send({ embeds: [summaryEmbed] });

        } catch (error) {
            console.error('Error ending activity check:', error);
        }

        // Clean up
        activeChecks.delete(checkId);
    },

    // Getter for active checks (used by other modules if needed)
    getActiveChecks() {
        return activeChecks;
    }
};

// Make client available globally for endCheck
module.exports.setClient = (client) => {
    global.client = client;
};
