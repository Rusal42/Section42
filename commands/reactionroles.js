const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const REACTION_ROLES_FILE = path.join(__dirname, '..', 'data', 'customReactionRoles.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(REACTION_ROLES_FILE)) {
    fs.writeFileSync(REACTION_ROLES_FILE, JSON.stringify({}, null, 2));
}

function loadReactionRoles() {
    try {
        const data = fs.readFileSync(REACTION_ROLES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveReactionRoles(data) {
    fs.writeFileSync(REACTION_ROLES_FILE, JSON.stringify(data, null, 2));
}

function parseDuration(input) {
    if (!input) return null;
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
}

module.exports = {
    name: 'reactionroles',
    description: 'Create and manage reaction role messages',
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Create and manage reaction role messages')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new reaction role message')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title for the reaction role message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description text')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send in (defaults to current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Time limit for claiming roles (e.g., 1h, 2h, 1d). Leave empty for permanent.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role button to an existing reaction role message')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the reaction role message')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give when clicked')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('label')
                        .setDescription('Button label text')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji for the button (optional)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('style')
                        .setDescription('Button color style')
                        .addChoices(
                            { name: 'Blue', value: 'Primary' },
                            { name: 'Gray', value: 'Secondary' },
                            { name: 'Green', value: 'Success' },
                            { name: 'Red', value: 'Danger' }
                        )
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role button from a message')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the reaction role message')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove from the message')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a time-limited reaction role message early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID to end')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a reaction role message entirely')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all reaction role messages in this server'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'create') {
                await this.handleCreate(interaction);
            } else if (subcommand === 'add') {
                await this.handleAdd(interaction);
            } else if (subcommand === 'remove') {
                await this.handleRemove(interaction);
            } else if (subcommand === 'end') {
                await this.handleEnd(interaction);
            } else if (subcommand === 'delete') {
                await this.handleDelete(interaction);
            } else if (subcommand === 'list') {
                await this.handleList(interaction);
            }
        } catch (error) {
            console.error('Reaction roles error:', error);
            const errorMsg = { content: `Error: ${error.message}`, ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    },

    async handleCreate(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const durationStr = interaction.options.getString('duration');
        
        // Parse duration if provided
        let duration = null;
        let endTime = null;
        if (durationStr) {
            duration = parseDuration(durationStr);
            if (!duration) {
                return interaction.reply({
                    content: 'Invalid duration format. Use: 30m, 1h, 2h, 1d',
                    ephemeral: true
                });
            }
            endTime = Date.now() + duration;
        }

        // Create initial embed
        let descText = description + '\n\nClick a button below to get a role!';
        if (endTime) {
            const endTimestamp = Math.floor(endTime / 1000);
            descText += `\n\n**Time limit:** Ends <t:${endTimestamp}:R>`;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(title)
            .setDescription(descText)
            .setFooter({ text: endTime ? 'Time-limited Reaction Roles' : 'Reaction Roles' })
            .setTimestamp();

        // Send message with empty row (buttons added later)
        const message = await channel.send({ 
            embeds: [embed],
            components: []
        });

        // Store in database
        const reactionRoles = loadReactionRoles();
        reactionRoles[message.id] = {
            guildId: interaction.guild.id,
            channelId: channel.id,
            messageId: message.id,
            title,
            description,
            endTime,
            ended: false,
            roles: [] // Will be populated with add command
        };
        saveReactionRoles(reactionRoles);
        
        // Set up timer if duration specified
        if (endTime) {
            setTimeout(async () => {
                await this.expireReactionRole(message.id);
            }, duration);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Reaction Roles Message Created')
            .setDescription(
                `Message sent to <#${channel.id}>\n` +
                `Message ID: \`${message.id}\`\n` +
                (endTime ? `**Time limit:** Ends <t:${Math.floor(endTime / 1000)}:R>\n` : '**Duration:** Permanent\n') +
                `\nUse \`/reactionroles add\` to add role buttons to this message.`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },

    async handleAdd(interaction) {
        const messageId = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const label = interaction.options.getString('label');
        const emoji = interaction.options.getString('emoji');
        const style = interaction.options.getString('style') || 'Secondary';

        // Load data
        const reactionRoles = loadReactionRoles();
        const config = reactionRoles[messageId];

        if (!config) {
            return interaction.reply({
                content: 'No reaction role message found with that ID.',
                ephemeral: true
            });
        }

        // Verify message exists
        try {
            const channel = await interaction.guild.channels.fetch(config.channelId);
            const message = await channel.messages.fetch(messageId);

            // Check if role already exists
            if (config.roles.some(r => r.roleId === role.id)) {
                return interaction.reply({
                    content: `Role <@&${role.id}> is already on this message.`,
                    ephemeral: true
                });
            }

            // Add to config
            config.roles.push({
                roleId: role.id,
                label,
                emoji,
                style
            });
            saveReactionRoles(reactionRoles);

            // Update message with new buttons
            await this.updateMessageButtons(message, config);

            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('Role Button Added')
                .setDescription(
                    `Added button for <@&${role.id}>\n` +
                    `Label: ${emoji ? emoji + ' ' : ''}${label}\n` +
                    `Style: ${style}`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (error) {
            console.error('Error updating message:', error);
            return interaction.reply({
                content: 'Could not find that message. It may have been deleted.',
                ephemeral: true
            });
        }
    },

    async handleRemove(interaction) {
        const messageId = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');

        const reactionRoles = loadReactionRoles();
        const config = reactionRoles[messageId];

        if (!config) {
            return interaction.reply({
                content: 'No reaction role message found with that ID.',
                ephemeral: true
            });
        }

        // Remove from config
        const initialLength = config.roles.length;
        config.roles = config.roles.filter(r => r.roleId !== role.id);
        
        if (config.roles.length === initialLength) {
            return interaction.reply({
                content: `Role <@&${role.id}> was not found on this message.`,
                ephemeral: true
            });
        }

        saveReactionRoles(reactionRoles);

        // Update message
        try {
            const channel = await interaction.guild.channels.fetch(config.channelId);
            const message = await channel.messages.fetch(messageId);
            await this.updateMessageButtons(message, config);

            const successEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('Role Button Removed')
                .setDescription(`Removed button for <@&${role.id}>`)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            return interaction.reply({
                content: 'Role removed from database but could not update message.',
                ephemeral: true
            });
        }
    },

    async handleDelete(interaction) {
        const messageId = interaction.options.getString('message_id');

        const reactionRoles = loadReactionRoles();
        const config = reactionRoles[messageId];

        if (!config) {
            return interaction.reply({
                content: 'No reaction role message found with that ID.',
                ephemeral: true
            });
        }

        // Try to delete the message
        try {
            const channel = await interaction.guild.channels.fetch(config.channelId);
            const message = await channel.messages.fetch(messageId);
            await message.delete();
        } catch (error) {
            console.log('Could not delete message, may already be deleted');
        }

        // Remove from database
        delete reactionRoles[messageId];
        saveReactionRoles(reactionRoles);

        const successEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('Reaction Roles Message Deleted')
            .setDescription('The message has been deleted.')
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },

    async handleList(interaction) {
        const reactionRoles = loadReactionRoles();
        const guildConfigs = Object.values(reactionRoles).filter(c => c.guildId === interaction.guild.id);

        if (guildConfigs.length === 0) {
            return interaction.reply({
                content: 'No reaction role messages found in this server.',
                ephemeral: true
            });
        }

        const listEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Reaction Role Messages')
            .setDescription(`Found ${guildConfigs.length} message(s):`)
            .setTimestamp();

        for (const config of guildConfigs) {
            const roleList = config.roles.map(r => `<@&${r.roleId}>`).join(', ') || 'No roles added';
            
            listEmbed.addFields({
                name: config.title,
                value: 
                    `Message ID: \`${config.messageId}\`\n` +
                    `Channel: <#${config.channelId}>\n` +
                    `Roles: ${roleList}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [listEmbed], ephemeral: true });
    },

    async updateMessageButtons(message, config) {
        // Discord limits: 5 buttons per row, max 5 rows (25 buttons total)
        const rows = [];
        let currentRow = new ActionRowBuilder();
        let buttonCount = 0;

        for (const roleConfig of config.roles) {
            if (buttonCount > 0 && buttonCount % 5 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }

            const button = new ButtonBuilder()
                .setCustomId(`reactionrole_${config.messageId}_${roleConfig.roleId}`)
                .setLabel(roleConfig.label)
                .setStyle(ButtonStyle[roleConfig.style]);

            if (roleConfig.emoji) {
                button.setEmoji(roleConfig.emoji);
            }

            currentRow.addComponents(button);
            buttonCount++;
        }

        if (currentRow.components.length > 0) {
            rows.push(currentRow);
        }

        // Update the message
        const embed = message.embeds[0];
        await message.edit({
            embeds: [EmbedBuilder.from(embed)],
            components: rows
        });
    },

    async handleEnd(interaction) {
        const messageId = interaction.options.getString('message_id');
        
        const reactionRoles = loadReactionRoles();
        const config = reactionRoles[messageId];

        if (!config) {
            return interaction.reply({
                content: 'No reaction role message found with that ID.',
                ephemeral: true
            });
        }

        if (config.ended) {
            return interaction.reply({
                content: 'This reaction role message has already ended.',
                ephemeral: true
            });
        }

        await this.expireReactionRole(messageId);

        const successEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('Reaction Roles Ended')
            .setDescription(`Reaction role message \`${messageId}\` has been ended early. Buttons are now disabled.`)
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },

    async expireReactionRole(messageId) {
        const reactionRoles = loadReactionRoles();
        const config = reactionRoles[messageId];

        if (!config || config.ended) return;

        config.ended = true;
        saveReactionRoles(reactionRoles);

        try {
            const { client } = require('../index');
            const guild = await client.guilds.fetch(config.guildId);
            const channel = await guild.channels.fetch(config.channelId);
            const message = await channel.messages.fetch(messageId);

            // Update embed to show expired
            const expiredEmbed = EmbedBuilder.from(message.embeds[0])
                .setColor('#95a5a6')
                .setTitle(message.embeds[0].title + ' (Ended)')
                .setDescription(
                    message.embeds[0].description.replace(
                        /\*\*Time limit:.*$/m,
                        '**Status:** This has ended. Roles can no longer be claimed.'
                    )
                )
                .setFooter({ text: 'This reaction role message has ended' });

            // Disable all buttons
            const disabledRows = [];
            for (const row of message.components) {
                const newRow = ActionRowBuilder.from(row);
                for (const component of newRow.components) {
                    if (component.data.type === 2) { // Button
                        component.setDisabled(true);
                    }
                }
                disabledRows.push(newRow);
            }

            await message.edit({
                embeds: [expiredEmbed],
                components: disabledRows
            });

            console.log(`Reaction role message ${messageId} has expired`);
        } catch (error) {
            console.error('Error expiring reaction role message:', error);
        }
    }
};
