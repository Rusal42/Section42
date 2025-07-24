const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Handle button interactions
            if (interaction.isButton()) {
                // Rules acceptance button
                if (interaction.customId === 'accept_rules') {
                    console.log(`📋 ${interaction.user.tag} clicked accept rules button`);
                    
                    // Find the Member role
                    const memberRole = interaction.guild.roles.cache.find(role => role.name === '👤 Member');
                    
                    if (!memberRole) {
                        console.error('Member role not found in server');
                        return interaction.reply({ 
                            content: '❌ Member role not found. Please contact an administrator.', 
                            ephemeral: true 
                        });
                    }
                    
                    // Check if user already has the Member role
                    if (interaction.member.roles.cache.has(memberRole.id)) {
                        return interaction.reply({ 
                            content: '✅ You have already accepted the rules and have access to the server!', 
                            ephemeral: true 
                        });
                    }
                    
                    // Assign the Member role
                    await interaction.member.roles.add(memberRole, 'Rules accepted via button');
                    
                    // Remove Newbie role if they have it
                    const newbieRole = interaction.guild.roles.cache.find(role => role.name === '🌱 Newbie');
                    if (newbieRole && interaction.member.roles.cache.has(newbieRole.id)) {
                        await interaction.member.roles.remove(newbieRole, 'Promoted to Member after accepting rules');
                    }
                    
                    // Send success message
                    const successEmbed = new EmbedBuilder()
                        .setColor('#b6dbd9')
                        .setTitle('🎉 Welcome to the Server!')
                        .setDescription(`Welcome ${interaction.user}! You now have full access to the server.`)
                        .addFields(
                            {
                                name: '✅ Rules Accepted',
                                value: 'You have successfully accepted the server rules and received the Member role.',
                                inline: false
                            },
                            {
                                name: '🚀 What\'s Next?',
                                value: '• Explore all the channels now available to you\n• Visit the roles channel to select additional roles\n• Join conversations in general chat\n• Check out the media and casino sections',
                                inline: false
                            }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp()
                        .setFooter({ text: 'Enjoy your stay!', iconURL: interaction.guild.iconURL() });
                    
                    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    
                    // Log to general channel
                    const generalChannel = interaction.guild.channels.cache.find(channel => 
                        channel.name === '💬-general' && channel.type === 0
                    );
                    
                    if (generalChannel) {
                        const welcomeEmbed = new EmbedBuilder()
                            .setColor('#b6dbd9')
                            .setDescription(`🎉 ${interaction.user} has joined the server by accepting the rules! Welcome!`)
                            .setTimestamp();
                        
                        await generalChannel.send({ embeds: [welcomeEmbed] });
                    }
                    
                    console.log(`✅ Assigned Member role to ${interaction.user.tag} after accepting rules`);
                }
                
                // Color role selection buttons
                else if (interaction.customId.startsWith('color_')) {
                    console.log(`🎨 ${interaction.user.tag} clicked color button: ${interaction.customId}`);
                    
                    // Define color roles with their hex codes
                    const colorRoles = {
                        'color_red': { name: '🔴 Red', color: '#ff0000' },
                        'color_orange': { name: '🟠 Orange', color: '#ff8c00' },
                        'color_yellow': { name: '🟡 Yellow', color: '#ffd700' },
                        'color_green': { name: '🟢 Green', color: '#32cd32' },
                        'color_blue': { name: '🔵 Blue', color: '#1e90ff' },
                        'color_purple': { name: '🟣 Purple', color: '#9370db' },
                        'color_brown': { name: '🟤 Brown', color: '#8b4513' },
                        'color_black': { name: '⚫ Black', color: '#2c2c2c' },
                        'color_white': { name: '⚪ White', color: '#f5f5f5' },
                        'color_pink': { name: '🩷 Pink', color: '#ff69b4' }
                    };
                    
                    if (interaction.customId === 'color_remove') {
                        // Remove all color roles
                        const colorRoleNames = Object.values(colorRoles).map(role => role.name);
                        const userColorRoles = interaction.member.roles.cache.filter(role => 
                            colorRoleNames.includes(role.name)
                        );
                        
                        if (userColorRoles.size === 0) {
                            return interaction.reply({ 
                                content: '❌ You don\'t have any color roles to remove!', 
                                ephemeral: true 
                            });
                        }
                        
                        await interaction.member.roles.remove(userColorRoles, 'Color role removed by user');
                        
                        const removeEmbed = new EmbedBuilder()
                            .setColor('#b6dbd9')
                            .setTitle('🗑️ Color Role Removed')
                            .setDescription('Your color role has been successfully removed!')
                            .setTimestamp();
                        
                        return interaction.reply({ embeds: [removeEmbed], ephemeral: true });
                    }
                    
                    // Handle color selection
                    const selectedColor = colorRoles[interaction.customId];
                    if (!selectedColor) {
                        return interaction.reply({ 
                            content: '❌ Invalid color selection!', 
                            ephemeral: true 
                        });
                    }
                    
                    // Find or create the color role
                    let colorRole = interaction.guild.roles.cache.find(role => role.name === selectedColor.name);
                    
                    if (!colorRole) {
                        // Create the color role if it doesn't exist
                        try {
                            colorRole = await interaction.guild.roles.create({
                                name: selectedColor.name,
                                color: selectedColor.color,
                                hoist: false,
                                mentionable: false,
                                reason: 'Color role created for user selection'
                            });
                            console.log(`🎨 Created new color role: ${selectedColor.name}`);
                        } catch (createError) {
                            console.error('Error creating color role:', createError);
                            return interaction.reply({ 
                                content: '❌ Failed to create color role. Please contact an administrator.', 
                                ephemeral: true 
                            });
                        }
                    }
                    
                    // Remove any existing color roles from the user
                    const colorRoleNames = Object.values(colorRoles).map(role => role.name);
                    const userColorRoles = interaction.member.roles.cache.filter(role => 
                        colorRoleNames.includes(role.name)
                    );
                    
                    if (userColorRoles.size > 0) {
                        await interaction.member.roles.remove(userColorRoles, 'Removing old color roles');
                    }
                    
                    // Add the new color role
                    await interaction.member.roles.add(colorRole, 'Color role selected by user');
                    
                    // Send success message
                    const successEmbed = new EmbedBuilder()
                        .setColor(selectedColor.color)
                        .setTitle('🎨 Color Role Updated!')
                        .setDescription(`You now have the **${selectedColor.name}** color role!`)
                        .addFields(
                            {
                                name: '✨ Your New Color',
                                value: `${selectedColor.name}`,
                                inline: true
                            },
                            {
                                name: '💡 Tip',
                                value: 'You can change your color anytime with `!colors`',
                                inline: true
                            }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    
                    console.log(`🎨 Assigned ${selectedColor.name} role to ${interaction.user.tag}`);
                }
            }
            
        } catch (error) {
            console.error('Error handling interaction:', error);
            
            if (interaction.isButton() && !interaction.replied) {
                try {
                    await interaction.reply({ 
                        content: '❌ An error occurred while processing your request. Please try again or contact an administrator.', 
                        ephemeral: true 
                    });
                } catch (replyError) {
                    console.error('Error sending error reply:', replyError);
                }
            }
        }
    },
};
