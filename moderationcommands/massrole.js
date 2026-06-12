const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, Role } = require('discord.js');

module.exports = {
    name: 'massrole',
    description: 'Manage roles for multiple users server-wide',
    data: new SlashCommandBuilder()
        .setName('massrole')
        .setDescription('Manage roles for multiple users server-wide')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add roles to users who dont have them')
                .addStringOption(option =>
                    option.setName('roles')
                        .setDescription('Role names, IDs, or mentions (comma-separated)')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('require_role')
                        .setDescription('Only affect users who have this role (optional)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('exclude_bots')
                        .setDescription('Exclude bot accounts (default: true)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove roles from users who have them')
                .addStringOption(option =>
                    option.setName('roles')
                        .setDescription('Role names, IDs, or mentions (comma-separated)')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('require_role')
                        .setDescription('Only affect users who have this role (optional)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('exclude_bots')
                        .setDescription('Exclude bot accounts (default: true)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('replace')
                .setDescription('Replace one role with another on all users')
                .addRoleOption(option =>
                    option.setName('old_role')
                        .setDescription('Role to remove')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('new_role')
                        .setDescription('Role to add')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('exclude_bots')
                        .setDescription('Exclude bot accounts (default: true)')
                        .setRequired(false)))
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
                .setTitle('Massrole Usage')
                .setDescription(
                    '`!massrole add @Role` - Add role to users without it\n' +
                    '`!massrole add @Role1 @Role2` - Add multiple roles\n' +
                    '`!massrole remove @Role` - Remove role from users\n' +
                    '`!massrole replace @OldRole @NewRole` - Swap roles\n\n' +
                    'Roles can be mentions (@Role), names, or IDs. Multiple roles can be space or comma-separated.'
                )
                .setTimestamp();
            return message.channel.send({ embeds: [usageEmbed] });
        }

        const subcommand = args[0].toLowerCase();
        
        if (subcommand === 'replace') {
            if (args.length < 3) {
                return message.channel.send('Usage: `!massrole replace <old_role> <new_role>`');
            }
            return this.handleReplace(message, args.slice(1));
        }

        if (subcommand === 'add' || subcommand === 'remove') {
            const rolesArg = args.slice(1).join(' ');
            return this.handleAddRemove(message, subcommand, rolesArg);
        }

        return message.channel.send('Invalid subcommand. Use `add`, `remove`, or `replace`.');
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        await interaction.deferReply({ ephemeral: true });

        try {
            if (subcommand === 'replace') {
                const oldRole = interaction.options.getRole('old_role');
                const newRole = interaction.options.getRole('new_role');
                const excludeBots = interaction.options.getBoolean('exclude_bots') ?? true;
                
                await this.processReplace(interaction, [oldRole], newRole, excludeBots);
            } else {
                const rolesString = interaction.options.getString('roles');
                const requireRole = interaction.options.getRole('require_role');
                const excludeBots = interaction.options.getBoolean('exclude_bots') ?? true;
                
                const roles = await this.parseRoles(interaction.guild, rolesString);
                
                if (roles.length === 0) {
                    return interaction.editReply({
                        content: 'Could not find any valid roles. Use role names, IDs, or mentions.',
                        ephemeral: true
                    });
                }

                if (subcommand === 'add') {
                    await this.processAdd(interaction, roles, requireRole, excludeBots);
                } else {
                    await this.processRemove(interaction, roles, requireRole, excludeBots);
                }
            }
        } catch (error) {
            console.error('Massrole error:', error);
            await interaction.editReply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    },

    async handleAddRemove(message, action, rolesArg) {
        const roles = await this.parseRoles(message.guild, rolesArg);
        
        if (roles.length === 0) {
            return message.channel.send('Could not find any valid roles. Use role names, IDs, or mentions.');
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Processing Massrole...')
            .setDescription(`Working on ${roles.length} role(s)... This may take a moment.`)
            .setTimestamp();
        
        const statusMsg = await message.channel.send({ embeds: [loadingEmbed] });

        try {
            if (action === 'add') {
                await this.processAdd(message, roles, null, true, statusMsg);
            } else {
                await this.processRemove(message, roles, null, true, statusMsg);
            }
        } catch (error) {
            console.error('Massrole error:', error);
            statusMsg.edit({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error')
                    .setDescription(`Failed: ${error.message}`)
                    .setTimestamp()]
            });
        }
    },

    async handleReplace(message, args) {
        const oldRoles = await this.parseRoles(message.guild, args[0]);
        const newRoles = await this.parseRoles(message.guild, args[1]);
        
        if (oldRoles.length === 0 || newRoles.length === 0) {
            return message.channel.send('Could not find one or both roles. Use role names, IDs, or mentions.');
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Processing Role Replacement...')
            .setDescription(`Replacing ${oldRoles[0].name} with ${newRoles[0].name}...`)
            .setTimestamp();
        
        const statusMsg = await message.channel.send({ embeds: [loadingEmbed] });
        
        await this.processReplace(message, oldRoles, newRoles[0], true, statusMsg);
    },

    async parseRoles(guild, input) {
        const roles = [];
        // Split by comma OR space (for prefix command flexibility)
        const parts = input.split(/[,\s]+/).filter(p => p.trim());
        
        for (const part of parts) {
            const cleanPart = part.trim().replace(/[<@&>]/g, '');
            if (!cleanPart) continue;
            
            // Try to find by ID first
            let role = guild.roles.cache.get(cleanPart);
            
            // Then by exact name match
            if (!role) {
                role = guild.roles.cache.find(r => 
                    r.name.toLowerCase() === cleanPart.toLowerCase()
                );
            }
            
            // Then by partial name match
            if (!role) {
                role = guild.roles.cache.find(r => 
                    r.name.toLowerCase().includes(cleanPart.toLowerCase())
                );
            }
            
            if (role) {
                roles.push(role);
            }
        }
        
        return [...new Set(roles)]; // Remove duplicates
    },

    async updateProgress(interactionOrMessage, statusMessage, embed) {
        if (statusMessage) {
            await statusMessage.edit({ embeds: [embed] });
        } else {
            // For slash commands
            await interactionOrMessage.editReply({ embeds: [embed] });
        }
    },

    async processAdd(interactionOrMessage, roles, requireRole, excludeBots, statusMessage = null) {
        const guild = interactionOrMessage.guild;
        
        // Update status to show we're fetching members
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Fetching Members...')
            .setDescription('This may take a moment for large servers.')
            .setTimestamp()
        );
        
        // Use fetch with cache to get all members (necessary for accurate results)
        const members = await guild.members.fetch();
        const totalMembers = members.size;
        
        // Update status to show processing
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Processing Members...')
            .setDescription(`Checking ${totalMembers} members...`)
            .setTimestamp()
        );
        
        let affected = 0;
        let skipped = 0;
        let failed = 0;
        let processed = 0;

        for (const [, member] of members) {
            processed++;
            
            if (excludeBots && member.user.bot) continue;
            if (requireRole && !member.roles.cache.has(requireRole.id)) continue;

            const rolesToAdd = roles.filter(r => !member.roles.cache.has(r.id));
            
            if (rolesToAdd.length === 0) {
                skipped++;
                continue;
            }

            try {
                await member.roles.add(rolesToAdd);
                affected++;
            } catch (error) {
                failed++;
            }
        }

        const resultEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Massrole Add Complete')
            .setDescription(
                `**Roles added:** ${roles.map(r => r.name).join(', ')}\n\n` +
                `Total members checked: **${processed}**\n` +
                `Members affected: **${affected}**\n` +
                `Already had roles: **${skipped}**\n` +
                `Failed (no permissions): **${failed}**`
            )
            .setTimestamp();

        if (statusMessage) {
            await statusMessage.edit({ embeds: [resultEmbed] });
        } else {
            await interactionOrMessage.editReply({ embeds: [resultEmbed] });
        }
    },

    async processRemove(interactionOrMessage, roles, requireRole, excludeBots, statusMessage = null) {
        const guild = interactionOrMessage.guild;
        
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Fetching Members...')
            .setDescription('This may take a moment for large servers.')
            .setTimestamp()
        );
        
        const members = await guild.members.fetch();
        const totalMembers = members.size;
        
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Processing Members...')
            .setDescription(`Checking ${totalMembers} members...`)
            .setTimestamp()
        );
        
        let affected = 0;
        let skipped = 0;
        let failed = 0;

        for (const [, member] of members) {
            if (excludeBots && member.user.bot) continue;
            if (requireRole && !member.roles.cache.has(requireRole.id)) continue;

            const rolesToRemove = roles.filter(r => member.roles.cache.has(r.id));
            
            if (rolesToRemove.length === 0) {
                skipped++;
                continue;
            }

            try {
                await member.roles.remove(rolesToRemove);
                affected++;
            } catch (error) {
                failed++;
            }
        }

        const resultEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('Massrole Remove Complete')
            .setDescription(
                `**Roles removed:** ${roles.map(r => r.name).join(', ')}\n\n` +
                `Total members checked: **${totalMembers}**\n` +
                `Members affected: **${affected}**\n` +
                `Did not have roles: **${skipped}**\n` +
                `Failed (no permissions): **${failed}**`
            )
            .setTimestamp();

        if (statusMessage) {
            await statusMessage.edit({ embeds: [resultEmbed] });
        } else {
            await interactionOrMessage.editReply({ embeds: [resultEmbed] });
        }
    },

    async processReplace(interactionOrMessage, oldRoles, newRole, excludeBots, statusMessage = null) {
        const guild = interactionOrMessage.guild;
        const oldRole = oldRoles[0];
        
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Fetching Members...')
            .setDescription('This may take a moment for large servers.')
            .setTimestamp()
        );
        
        const members = await guild.members.fetch();
        const totalMembers = members.size;
        
        await this.updateProgress(interactionOrMessage, statusMessage, new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Processing Members...')
            .setDescription(`Checking ${totalMembers} members...`)
            .setTimestamp()
        );
        
        let affected = 0;
        let skipped = 0;
        let failed = 0;

        for (const [, member] of members) {
            if (excludeBots && member.user.bot) continue;
            if (!member.roles.cache.has(oldRole.id)) {
                skipped++;
                continue;
            }

            try {
                await member.roles.remove(oldRole);
                await member.roles.add(newRole);
                affected++;
            } catch (error) {
                failed++;
            }
        }

        const resultEmbed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('Role Replacement Complete')
            .setDescription(
                `**Replaced:** ${oldRole.name} → ${newRole.name}\n\n` +
                `Total members checked: **${totalMembers}**\n` +
                `Members affected: **${affected}**\n` +
                `Did not have old role: **${skipped}**\n` +
                `Failed (no permissions): **${failed}**`
            )
            .setTimestamp();

        if (statusMessage) {
            await statusMessage.edit({ embeds: [resultEmbed] });
        } else {
            await interactionOrMessage.editReply({ embeds: [resultEmbed] });
        }
    }
};
