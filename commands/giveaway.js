const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'giveaway',
    description: 'Start a giveaway',
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a giveaway')
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('What are you giving away?')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10080))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to start giveaways.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        if (args.length < 2) {
            const usageEmbed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('Giveaway Command Usage')
                .setDescription('**Usage:** `!giveaway <duration> <winners> | <prize>`\n\n**Examples:**\n`!giveaway 60 1 | Discord Nitro`\n`!giveaway 1440 3 | $50 Steam Gift Card`')
                .addFields(
                    { name: 'Duration', value: 'Time in minutes (e.g., 60 = 1 hour, 1440 = 1 day)', inline: false },
                    { name: 'Winners', value: 'Number of winners to select', inline: false },
                    { name: 'Prize', value: 'What you\'re giving away', inline: false }
                )
                .setTimestamp();
            return message.channel.send({ embeds: [usageEmbed] });
        }

        const duration = parseInt(args[0]);
        const winners = parseInt(args[1]);
        const prizeIndex = args.findIndex(arg => arg === '|');
        
        if (prizeIndex === -1 || prizeIndex === args.length - 1) {
            return message.channel.send('Please use the format: `!giveaway <duration> <winners> | <prize>`');
        }

        const prize = args.slice(prizeIndex + 1).join(' ');

        if (isNaN(duration) || duration < 1 || duration > 10080) {
            return message.channel.send('Duration must be between 1 minute and 1 week (10080 minutes).');
        }

        if (isNaN(winners) || winners < 1 || winners > 20) {
            return message.channel.send('Number of winners must be between 1 and 20.');
        }

        await message.delete().catch(() => {});

        const endTime = Date.now() + (duration * 60 * 1000);
        const endTimestamp = Math.floor(endTime / 1000);

        const giveawayEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n\n**Winners:** ${winners}\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n\nReact with 🎉 to enter!`)
            .setFooter({ text: `Hosted by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp(endTime);

        const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed] });
        await giveawayMessage.react('🎉');

        setTimeout(async () => {
            try {
                const fetchedMessage = await message.channel.messages.fetch(giveawayMessage.id);
                const reaction = fetchedMessage.reactions.cache.get('🎉');
                
                if (!reaction) {
                    const noReactionEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Giveaway Ended')
                        .setDescription(`**Prize:** ${prize}\n\n❌ No valid entries!`)
                        .setTimestamp();
                    return fetchedMessage.reply({ embeds: [noReactionEmbed] });
                }

                const users = await reaction.users.fetch();
                const entries = users.filter(user => !user.bot);

                if (entries.size === 0) {
                    const noEntriesEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Giveaway Ended')
                        .setDescription(`**Prize:** ${prize}\n\n❌ No valid entries!`)
                        .setTimestamp();
                    return fetchedMessage.reply({ embeds: [noEntriesEmbed] });
                }

                const winnerCount = Math.min(winners, entries.size);
                const winnerArray = [];
                const entriesArray = Array.from(entries.values());

                for (let i = 0; i < winnerCount; i++) {
                    const randomIndex = Math.floor(Math.random() * entriesArray.length);
                    winnerArray.push(entriesArray[randomIndex]);
                    entriesArray.splice(randomIndex, 1);
                }

                const winnerMentions = winnerArray.map(user => `<@${user.id}>`).join(', ');

                const winnerEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 Giveaway Ended! 🎉')
                    .setDescription(`**Prize:** ${prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\nCongratulations! 🎊`)
                    .setFooter({ text: `${entries.size} total entries`, iconURL: message.guild.iconURL() })
                    .setTimestamp();

                await fetchedMessage.reply({ content: winnerMentions, embeds: [winnerEmbed] });

                const endedEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('🎉 GIVEAWAY ENDED 🎉')
                    .setDescription(`**Prize:** ${prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\n~~React with 🎉 to enter!~~`)
                    .setFooter({ text: `Hosted by ${message.author.tag} | ${entries.size} entries`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                await fetchedMessage.edit({ embeds: [endedEmbed] });

            } catch (error) {
                console.error('Error ending giveaway:', error);
            }
        }, duration * 60 * 1000);
    },

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to start giveaways.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getInteger('duration');
        const winners = interaction.options.getInteger('winners') || 1;

        const endTime = Date.now() + (duration * 60 * 1000);
        const endTimestamp = Math.floor(endTime / 1000);

        const giveawayEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n\n**Winners:** ${winners}\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n\nReact with 🎉 to enter!`)
            .setFooter({ text: `Hosted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(endTime);

        await interaction.reply({ embeds: [giveawayEmbed] });
        const giveawayMessage = await interaction.fetchReply();
        await giveawayMessage.react('🎉');

        setTimeout(async () => {
            try {
                const fetchedMessage = await interaction.channel.messages.fetch(giveawayMessage.id);
                const reaction = fetchedMessage.reactions.cache.get('🎉');
                
                if (!reaction) {
                    const noReactionEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Giveaway Ended')
                        .setDescription(`**Prize:** ${prize}\n\n❌ No valid entries!`)
                        .setTimestamp();
                    return fetchedMessage.reply({ embeds: [noReactionEmbed] });
                }

                const users = await reaction.users.fetch();
                const entries = users.filter(user => !user.bot);

                if (entries.size === 0) {
                    const noEntriesEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Giveaway Ended')
                        .setDescription(`**Prize:** ${prize}\n\n❌ No valid entries!`)
                        .setTimestamp();
                    return fetchedMessage.reply({ embeds: [noEntriesEmbed] });
                }

                const winnerCount = Math.min(winners, entries.size);
                const winnerArray = [];
                const entriesArray = Array.from(entries.values());

                for (let i = 0; i < winnerCount; i++) {
                    const randomIndex = Math.floor(Math.random() * entriesArray.length);
                    winnerArray.push(entriesArray[randomIndex]);
                    entriesArray.splice(randomIndex, 1);
                }

                const winnerMentions = winnerArray.map(user => `<@${user.id}>`).join(', ');

                const winnerEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 Giveaway Ended! 🎉')
                    .setDescription(`**Prize:** ${prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\nCongratulations! 🎊`)
                    .setFooter({ text: `${entries.size} total entries`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await fetchedMessage.reply({ content: winnerMentions, embeds: [winnerEmbed] });

                const endedEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('🎉 GIVEAWAY ENDED 🎉')
                    .setDescription(`**Prize:** ${prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\n~~React with 🎉 to enter!~~`)
                    .setFooter({ text: `Hosted by ${interaction.user.tag} | ${entries.size} entries`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await fetchedMessage.edit({ embeds: [endedEmbed] });

            } catch (error) {
                console.error('Error ending giveaway:', error);
            }
        }, duration * 60 * 1000);
    }
};
