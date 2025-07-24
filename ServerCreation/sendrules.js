const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'sendrules',
    description: 'Send the server rules with acceptance button',
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

            // Find the rules channel by name
            const rulesChannel = message.guild.channels.cache.find(channel => 
                channel.name === '📜-rules' && channel.type === 0
            );
            
            if (!rulesChannel) {
                const noChannelEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Rules Channel Not Found')
                    .setDescription('Could not find a channel named `📜-rules`. Make sure the server has been set up with `!setup` first.')
                    .setTimestamp();
                
                return message.reply({ embeds: [noChannelEmbed] });
            }

            // Create the rules embed
            const rulesEmbed = new EmbedBuilder()
                .setColor('#276275')
                .setTitle('📋 Server Rules')
                .setDescription('Welcome to **Section42**! Please read and accept our rules to gain full access to the server.')
                .addFields(
                    {
                        name: '1️⃣ Don\'t be a negative Nancy',
                        value: 'Keep the vibes positive and constructive. We\'re here to have a good time!',
                        inline: false
                    },
                    {
                        name: '2️⃣ Keep racial / derogatory slurs to a minimal',
                        value: 'Watch your language. We want everyone to feel welcome here.',
                        inline: false
                    },
                    {
                        name: '3️⃣ Be respectful',
                        value: 'Treat others how you want to be treated. Simple as that.',
                        inline: false
                    },
                    {
                        name: '4️⃣ No NSFW / GORE at all',
                        value: 'Keep it clean. No exceptions.',
                        inline: false
                    },
                    {
                        name: '5️⃣ Whatever the owner / admins say goes',
                        value: 'Staff decisions are final. If you have issues, DM us privately.',
                        inline: false
                    },
                    {
                        name: '6️⃣ Use channels for their corresponding topic',
                        value: 'Media in media channels, bots in bot channels, etc. Keep things organized!',
                        inline: false
                    },
                    {
                        name: '7️⃣ Keep arguments in dms',
                        value: 'Take heated discussions private. Don\'t air your drama in public channels.',
                        inline: false
                    },
                    {
                        name: '8️⃣ No spamming in text channels',
                        value: 'Don\'t flood channels with repetitive messages, emojis, or unnecessary content.',
                        inline: false
                    }
                )
                .addFields(
                    {
                        name: '📋 Discord Terms of Service',
                        value: 'All members must follow [Discord\'s Terms of Service](https://discord.com/terms). No exceptions.',
                        inline: false
                    }
                )
                .addFields(
                    {
                        name: '⚠️ Rule Violations',
                        value: 'Breaking these rules may result in warnings, timeouts, kicks, or permanent bans depending on severity.',
                        inline: false
                    },
                    {
                        name: '🎯 Ready to Join?',
                        value: 'Click the **Accept Rules** button below to receive the Member role and unlock full server access!',
                        inline: false
                    }
                )
                .setThumbnail(message.guild.iconURL())
                .setTimestamp()
                .setFooter({ 
                    text: 'By clicking Accept Rules, you agree to follow all server rules', 
                    iconURL: message.guild.iconURL() 
                });

            // Create the accept button
            const acceptButton = new ButtonBuilder()
                .setCustomId('accept_rules')
                .setLabel('✅ Accept Rules')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📋');

            const actionRow = new ActionRowBuilder()
                .addComponents(acceptButton);

            // Send the rules message to the rules channel
            await rulesChannel.send({ 
                embeds: [rulesEmbed], 
                components: [actionRow] 
            });

            // Send confirmation in the current channel BEFORE deleting
            const confirmEmbed = new EmbedBuilder()
                .setColor('#b6dbd9')
                .setTitle('✅ Rules Message Sent')
                .setDescription(`Successfully sent the rules message with acceptance button to ${rulesChannel}`)
                .addFields(
                    {
                        name: '📍 Target Channel',
                        value: `${rulesChannel} (${rulesChannel.id})`,
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

            console.log(`📋 Rules message sent by ${message.author.tag} in ${message.guild.name}`);

        } catch (error) {
            console.error('Error sending rules message:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while sending the rules message.')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};
