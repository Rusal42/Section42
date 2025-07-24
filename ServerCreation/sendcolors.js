const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'sendcolors',
    description: 'Send persistent color role selection message to get-roles channel',
    async execute(message, args) {
        try {
            // Check if user is the bot owner
            if (message.author.id !== '746068840978448565') {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Access Denied')
                    .setDescription('Only the bot owner can use this command.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noPermEmbed] });
            }

            // Find the get-roles channel by name
            const getRolesChannel = message.guild.channels.cache.find(channel => 
                channel.name === '🏷️-get-roles' && channel.type === 0
            );
            
            if (!getRolesChannel) {
                const noChannelEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Get-Roles Channel Not Found')
                    .setDescription('Could not find a channel named `🏷️-get-roles`. Make sure the server has been set up with `!setup` first.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noChannelEmbed] });
            }

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

            // Send the persistent color selection message to get-roles channel
            await getRolesChannel.send({ 
                embeds: [colorEmbed], 
                components: [colorRow1, colorRow2, removeRow] 
            });

            // Send confirmation in the current channel BEFORE deleting
            const confirmEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('✅ Color Selection Message Sent')
                .setDescription(`Successfully sent the persistent color role selection message to ${getRolesChannel}`)
                .addFields(
                    {
                        name: '📍 Target Channel',
                        value: `${getRolesChannel} (${getRolesChannel.id})`,
                        inline: true
                    },
                    {
                        name: '⚙️ Command Run From',
                        value: `${message.channel}`,
                        inline: true
                    }
                )
                .setTimestamp();

            await message.reply({ embeds: [confirmEmbed] });

            // Delete the command message AFTER sending confirmation
            setTimeout(async () => {
                try {
                    await message.delete();
                } catch (deleteError) {
                    console.log('Could not delete command message (may already be deleted)');
                }
            }, 1000);

            console.log(`🎨 Persistent color selection message sent by ${message.author.tag} to ${getRolesChannel.name}`);

        } catch (error) {
            console.error('Error sending color selection message:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while sending the color selection message.')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};
