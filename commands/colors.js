const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'colors',
    description: 'Select a color role to personalize your appearance',
    async execute(message, args) {
        try {
            // Check if user has Member role or higher
            const memberRole = message.guild.roles.cache.find(role => role.name === '👤 Member');
            const hasAccess = message.member.roles.cache.some(role => 
                role.name === '👤 Member' || 
                role.name === '🎨 Artist' || 
                role.name === '💎 VIP' || 
                role.name === '🛡️ Moderator' || 
                role.name === '⚡ Admin' ||
                role.name === '🚀 Section 42 Dev' ||
                role.name === '👑 Owner'
            );

            if (!hasAccess) {
                const noAccessEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Access Denied')
                    .setDescription('You need to accept the rules first to access color roles!')
                    .setTimestamp();
                
                return message.reply({ embeds: [noAccessEmbed] });
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
                        name: '📍 Tip',
                        value: 'You can also find a permanent color selection menu in the <#> get-roles channel!',
                        inline: false
                    }
                )
                .setThumbnail(message.author.displayAvatarURL())
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

            // Send the color selection message
            await message.reply({ 
                embeds: [colorEmbed], 
                components: [colorRow1, colorRow2, removeRow] 
            });

            console.log(`🎨 ${message.author.tag} opened color role selection`);

        } catch (error) {
            console.error('Error in colors command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while loading the color selection menu.')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};
