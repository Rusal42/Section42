const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'automod',
    description: 'Manage auto-moderation rules for the server',
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage auto-moderation rules')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all auto-moderation rules')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new auto-moderation rule')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of rule to create')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Block Profanity', value: 'profanity' },
                            { name: 'Block Spam', value: 'spam' },
                            { name: 'Block Invites', value: 'invites' },
                            { name: 'Block Keywords', value: 'keywords' },
                            { name: 'Block Mentions', value: 'mentions' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('keywords')
                        .setDescription('Keywords to block (for keyword type, comma-separated)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Custom name for the rule')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an auto-moderation rule')
                .addStringOption(option =>
                    option
                        .setName('rule')
                        .setDescription('Rule to delete')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable an auto-moderation rule')
                .addStringOption(option =>
                    option
                        .setName('rule')
                        .setDescription('Rule to toggle')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Administrator** permission to use auto-moderation commands.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            const subcommand = args[0]?.toLowerCase();
            
            switch (subcommand) {
                case 'list':
                    await this.listRules(message);
                    break;
                case 'create':
                    await this.createRule(message, args.slice(1));
                    break;
                case 'delete':
                    await this.deleteRule(message, args.slice(1));
                    break;
                case 'toggle':
                    await this.toggleRule(message, args.slice(1));
                    break;
                default:
                    await this.showHelp(message);
            }
        } catch (error) {
            console.error('Error executing automod command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while executing the auto-moderation command.')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async executeSlash(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Access Denied')
                    .setDescription('You need **Administrator** permission to use auto-moderation commands.')
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'list':
                    await this.listRules(interaction);
                    break;
                case 'create':
                    await this.createRule(interaction);
                    break;
                case 'delete':
                    await this.deleteRule(interaction);
                    break;
                case 'toggle':
                    await this.toggleRule(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error executing automod slash command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('An error occurred while executing the auto-moderation command.')
                .setTimestamp();
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async listRules(context) {
        try {
            const guild = context.guild;
            const rules = await guild.autoModerationRules.fetch();
            
            if (rules.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b35')
                    .setTitle('Auto-Moderation Rules')
                    .setDescription('No auto-moderation rules are currently set up.')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed] }) : await context.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Auto-Moderation Rules')
                .setDescription(`Found ${rules.size} rule(s):`)
                .setTimestamp();

            rules.forEach(rule => {
                const enabledStatus = rule.enabled ? '✅ Enabled' : '❌ Disabled';
                const triggerType = this.getTriggerTypeLabel(rule.triggerType);
                
                const createdDate = rule.createdAt ? rule.createdAt.toLocaleDateString() : 'Unknown';
                let ruleType = this.getTriggerTypeLabel(rule.triggerType);
                
                // Make rule type more descriptive based on rule name and content
                if (rule.name.toLowerCase().includes('invite') || 
                    (rule.triggerMetadata?.keywordFilter?.some(k => k.includes('discord.gg')))) {
                    ruleType = 'Invite Blocker';
                } else if (rule.name.toLowerCase().includes('profanity')) {
                    ruleType = 'Profanity Filter';
                } else if (rule.name.toLowerCase().includes('spam')) {
                    ruleType = 'Spam Protection';
                } else if (rule.name.toLowerCase().includes('keyword')) {
                    ruleType = 'Keyword Filter';
                } else if (rule.triggerType === 3) {
                    ruleType = 'Mention Spam';
                }
                
                embed.addFields({
                    name: `${rule.name} (${enabledStatus})`,
                    value: `**Type:** ${ruleType}\n**ID:** \`${rule.id}\`\n**Created:** ${createdDate}`,
                    inline: false
                });
            });

            if (context.isCommand) {
                await context.reply({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error listing automod rules:', error);
            throw error;
        }
    },

    async createRule(context, args = null) {
        try {
            const guild = context.guild;
            
            let type, keywords, customName;
            
            if (context.isCommand) {
                type = context.options.getString('type');
                keywords = context.options.getString('keywords');
                customName = context.options.getString('name');
            } else {
                type = args?.[0]?.toLowerCase();
                keywords = args?.slice(1).join(' ');
                customName = null;
            }

            if (!type) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Missing Parameters')
                    .setDescription('Please specify a rule type. Available types: profanity, spam, invites, keywords, mentions')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed], ephemeral: true }) : await context.reply({ embeds: [embed] });
            }

            const ruleConfig = this.getRuleConfig(type, keywords, customName);
            
            const rule = await guild.autoModerationRules.create({
                name: ruleConfig.name,
                eventType: 1, // MESSAGE_SEND
                triggerType: ruleConfig.triggerType,
                triggerMetadata: ruleConfig.triggerMetadata,
                actions: [
                    {
                        type: 1, // BLOCK_MESSAGE
                        metadata: {
                            customMessage: 'Your message was blocked by auto-moderation.'
                        }
                    },
                    {
                        type: 2, // SEND_ALERT_MESSAGE
                        metadata: {
                            channel: context.channel.id
                        }
                    }
                ],
                enabled: true,
                reason: `Created by ${context.author.tag} via automod command`
            });

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Auto-Moderation Rule Created')
                .setDescription(`Successfully created rule: **${rule.name}**`)
                .addFields(
                    { name: 'Rule ID', value: `\`${rule.id}\``, inline: true },
                    { name: 'Type', value: this.getTriggerTypeLabel(rule.triggerType), inline: true },
                    { name: 'Status', value: '✅ Enabled', inline: true }
                )
                .setTimestamp();

            if (context.isCommand) {
                await context.reply({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error creating automod rule:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error Creating Rule')
                .setDescription('Failed to create auto-moderation rule. Make sure the bot has the required permissions.')
                .setTimestamp();
            
            if (context.isCommand) {
                await context.reply({ embeds: [embed], ephemeral: true });
            } else {
                await context.reply({ embeds: [embed] });
            }
        }
    },

    async deleteRule(context, args = null) {
        try {
            const guild = context.guild;
            let ruleIdentifier;
            
            if (context.isCommand) {
                ruleIdentifier = context.options.getString('rule');
            } else {
                ruleIdentifier = args?.[0];
            }

            if (!ruleIdentifier) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Missing Parameters')
                    .setDescription('Please specify a rule ID or name to delete.')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed], ephemeral: true }) : await context.reply({ embeds: [embed] });
            }

            const rules = await guild.autoModerationRules.fetch();
            let rule = rules.get(ruleIdentifier);
            
            if (!rule) {
                rule = rules.find(r => r.name.toLowerCase().includes(ruleIdentifier.toLowerCase()));
            }

            if (!rule) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Rule Not Found')
                    .setDescription('No auto-moderation rule found with that ID or name.')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed], ephemeral: true }) : await context.reply({ embeds: [embed] });
            }

            await rule.delete(`Deleted by ${context.author.tag} via automod command`);

            const embed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Auto-Moderation Rule Deleted')
                .setDescription(`Successfully deleted rule: **${rule.name}**`)
                .setTimestamp();

            if (context.isCommand) {
                await context.reply({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error deleting automod rule:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error Deleting Rule')
                .setDescription('Failed to delete the auto-moderation rule.')
                .setTimestamp();
            
            if (context.isCommand) {
                await context.reply({ embeds: [embed], ephemeral: true });
            } else {
                await context.reply({ embeds: [embed] });
            }
        }
    },

    async toggleRule(context, args = null) {
        try {
            const guild = context.guild;
            let ruleIdentifier;
            
            if (context.isCommand) {
                ruleIdentifier = context.options.getString('rule');
            } else {
                ruleIdentifier = args?.[0];
            }

            if (!ruleIdentifier) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Missing Parameters')
                    .setDescription('Please specify a rule ID or name to toggle.')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed], ephemeral: true }) : await context.reply({ embeds: [embed] });
            }

            const rules = await guild.autoModerationRules.fetch();
            let rule = rules.get(ruleIdentifier);
            
            if (!rule) {
                rule = rules.find(r => r.name.toLowerCase().includes(ruleIdentifier.toLowerCase()));
            }

            if (!rule) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Rule Not Found')
                    .setDescription('No auto-moderation rule found with that ID or name.')
                    .setTimestamp();
                
                return context.isCommand ? await context.reply({ embeds: [embed], ephemeral: true }) : await context.reply({ embeds: [embed] });
            }

            const newStatus = !rule.enabled;
            await rule.edit({ enabled: newStatus });

            const embed = new EmbedBuilder()
                .setColor(newStatus ? '#00ff00' : '#ff6b35')
                .setTitle('Auto-Moderation Rule Updated')
                .setDescription(`Successfully ${newStatus ? 'enabled' : 'disabled'} rule: **${rule.name}**`)
                .addFields(
                    { name: 'Status', value: newStatus ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: 'Rule ID', value: `\`${rule.id}\``, inline: true }
                )
                .setTimestamp();

            if (context.isCommand) {
                await context.reply({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error toggling automod rule:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error Updating Rule')
                .setDescription('Failed to update the auto-moderation rule.')
                .setTimestamp();
            
            if (context.isCommand) {
                await context.reply({ embeds: [embed], ephemeral: true });
            } else {
                await context.reply({ embeds: [embed] });
            }
        }
    },

    async showHelp(context) {
        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Auto-Moderation Help')
            .setDescription('Manage Discord\'s native auto-moderation rules')
            .addFields(
                {
                    name: 'Commands',
                    value: '**`!automod list`** - List all rules\n**`!automod create <type> [keywords]`** - Create a new rule\n**`!automod delete <rule>`** - Delete a rule\n**`!automod toggle <rule>`** - Enable/disable a rule',
                    inline: false
                },
                {
                    name: 'Available Types',
                    value: '**profanity** - Block profanity\n**spam** - Block spam messages\n**invites** - Block server invites\n**keywords** - Block custom keywords\n**mentions** - Block excessive mentions',
                    inline: false
                },
                {
                    name: 'Examples',
                    value: '**`!automod create profanity`**\n**`!automod create keywords "bad word, another word"`**\n**`!automod toggle profanity`**',
                    inline: false
                }
            )
            .setTimestamp();

        await context.reply({ embeds: [embed] });
    },

    getRuleConfig(type, keywords, customName) {
        const configs = {
            profanity: {
                name: customName || 'Block Profanity',
                triggerType: 4, // KEYWORD
                triggerMetadata: {
                    keywordFilter: ['fuck', 'shit', 'cunt', 'bitch', 'asshole', 'dick', 'pussy', 'cock', 'whore', 'slut'],
                    regexPatterns: []
                }
            },
            spam: {
                name: customName || 'Block Spam',
                triggerType: 5, // SPAM
                triggerMetadata: {}
            },
            invites: {
                name: customName || 'Block Invites',
                triggerType: 1, // KEYWORD
                triggerMetadata: {
                    keywordFilter: ['discord.gg', 'discord.com/invite', 'invite.gg'],
                    regexPatterns: ['discord\\.gg/[\\w-]+', 'discord\\.com/invite/[\\w-]+']
                }
            },
            keywords: {
                name: customName || 'Block Keywords',
                triggerType: 1, // KEYWORD
                triggerMetadata: {
                    keywordFilter: keywords ? keywords.split(',').map(k => k.trim()) : [],
                    regexPatterns: []
                }
            },
            mentions: {
                name: customName || 'Block Excessive Mentions',
                triggerType: 3, // MENTION_SPAM
                triggerMetadata: {
                    mentionTotalLimit: 5
                }
            }
        };

        return configs[type] || configs.profanity;
    },

    getTriggerTypeLabel(triggerType) {
        const labels = {
            1: 'Keyword',
            2: 'Harmful Link',
            3: 'Mention Spam',
            4: 'Keyword (Advanced)',
            5: 'Spam'
        };
        return labels[triggerType] || 'Unknown';
    }
};

