const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    name: 'servclear',
    description: 'Clears all channels and roles from the server (Admin only)',
    
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
                .setDescription('I need Administrator permission to clear the server.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        // Confirmation message
        const confirmEmbed = new EmbedBuilder()
            .setColor('#276275')
            .setTitle('⚠️ Server Clear Warning')
            .setDescription('This will delete **ALL** channels and roles in the server!')
            .addFields(
                {
                    name: '🔄 How to Proceed',
                    value: 'Click **Confirm** to proceed or **Cancel** to abort',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: 'You have 30 seconds to respond',
                    inline: true
                },
                {
                    name: '⚠️ Warning',
                    value: 'This action **cannot** be undone!',
                    inline: true
                }
            )
            .setTimestamp();

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_clear')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('✅');

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_clear')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);

        const confirmMessage = await message.channel.send({ 
            embeds: [confirmEmbed], 
            components: [row] 
        });

        // Wait for button interaction
        const filter = (interaction) => {
            return ['confirm_clear', 'cancel_clear'].includes(interaction.customId) && interaction.user.id === message.author.id;
        };

        try {
            const interaction = await confirmMessage.awaitMessageComponent({ 
                filter, 
                time: 30000 
            });

            if (interaction.customId === 'cancel_clear') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#77bfba')
                    .setTitle('❌ Server Clear Cancelled')
                    .setDescription('The server clear operation has been cancelled.')
                    .setTimestamp();
                await interaction.update({ embeds: [cancelEmbed], components: [] });
                return;
            }

            if (interaction.customId === 'confirm_clear') {
                await interaction.deferUpdate();
                const clearEmbed = new EmbedBuilder()
                    .setColor('#277571')
                    .setTitle('🧹 Clearing Server')
                    .setDescription('Deleting channels and roles... This may take a moment.')
                    .setTimestamp();
                const clearMessage = await message.channel.send({ embeds: [clearEmbed] });

                try {
                    // Store reference to current channel for deletion later
                    const currentChannel = message.channel;
                    
                    // Delete all channels except the current one (so we can send completion message)
                    const channelsToDelete = message.guild.channels.cache.filter(channel => 
                        channel.id !== message.channel.id
                    );
                    
                    console.log(`🗑️ Deleting ${channelsToDelete.size + 1} channels...`);
                    
                    const deleteChannelPromises = channelsToDelete.map(channel =>
                        channel.delete().catch(error => {
                            console.error(`Failed to delete channel ${channel.name}:`, error);
                        })
                    );
                    
                    await Promise.all(deleteChannelPromises);

                    // Delete all roles except @everyone and bot roles
                    const rolesToDelete = message.guild.roles.cache.filter(role => 
                        !role.managed && // Don't delete bot roles
                        role.id !== message.guild.roles.everyone.id && // Don't delete @everyone
                        role.comparePositionTo(message.guild.members.me.roles.highest) < 0 // Only delete roles below bot's highest role
                    );

                    console.log(`🗑️ Deleting ${rolesToDelete.size} roles...`);

                    const deleteRolePromises = rolesToDelete.map(role =>
                        role.delete().catch(error => {
                            console.error(`Failed to delete role ${role.name}:`, error);
                        })
                    );

                    await Promise.all(deleteRolePromises);

                    // Reset server settings
                    await message.guild.setAFKChannel(null).catch(() => {});
                    await message.guild.setSystemChannel(null).catch(() => {});

                    // Create a setup channel for running !setup
                    let setupChannel = null;
                    try {
                        setupChannel = await message.guild.channels.create({
                            name: 'server-setup',
                            type: ChannelType.GuildText,
                            reason: 'Created after server clear for setup purposes'
                        });
                    } catch (error) {
                        console.error('Failed to create setup channel:', error);
                    }

                    const successEmbed = new EmbedBuilder()
                        .setColor('#b6dbd9')
                        .setTitle('✅ Server Cleared Successfully!')
                        .addFields(
                            {
                                name: '🗑️ Deleted Items',
                                value: `• **${channelsToDelete.size + 1}** channels\n• **${rolesToDelete.size}** roles`,
                                inline: true
                            },
                            {
                                name: '⚙️ Reset Settings',
                                value: '• AFK channel\n• System channel',
                                inline: true
                            },
                            {
                                name: '🚀 Next Steps',
                                value: setupChannel ? 
                                    `Head to ${setupChannel} and run \`!setup\` to create your organized server structure!` :
                                    'Run `!setup` to create your organized server structure!',
                                inline: false
                            }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Server cleared by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

                    // Send success message to setup channel if created, otherwise current channel
                    const targetChannel = setupChannel || message.channel;
                    await targetChannel.send({ embeds: [successEmbed] });
                    
                    // Now delete the original channel where the command was run
                    if (setupChannel && currentChannel.id !== setupChannel.id) {
                        try {
                            await currentChannel.delete();
                        } catch (error) {
                            console.error('Failed to delete original channel:', error);
                        }
                    }

                } catch (error) {
                    console.error('Error during server clear:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Clear Failed')
                        .setDescription('An error occurred while clearing the server. Some items may not have been deleted.')
                        .setTimestamp();
                    clearMessage.edit({ embeds: [errorEmbed] });
                    // Remove buttons from original message
                    confirmMessage.edit({ components: [] }).catch(() => {});
                }
            }

        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#77bfba')
                .setTitle('⏰ Confirmation Timed Out')
                .setDescription('Server clear cancelled due to no response within 30 seconds.')
                .setTimestamp();
            confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    }
};
