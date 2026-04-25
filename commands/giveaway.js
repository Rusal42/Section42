const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function parseDuration(input) {
    const match = input.match(/^(\d+)([smhd])$/i);
    if (!match) {
        // Try parsing as just a number (assume minutes)
        const num = parseInt(input);
        return isNaN(num) ? null : num;
    }
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 's': return Math.ceil(value / 60); // seconds to minutes
        case 'm': return value; // minutes
        case 'h': return value * 60; // hours to minutes
        case 'd': return value * 1440; // days to minutes
        default: return null;
    }
}

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
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 30s, 5m, 2h, 1d)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20))
        .addIntegerOption(option =>
            option.setName('min_participants')
                .setDescription('Minimum participants required (giveaway fails if not met)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(1000))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to start giveaways.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const prize = interaction.options.getString('prize');
        const durationInput = interaction.options.getString('duration');
        const duration = parseDuration(durationInput);
        
        if (!duration || duration < 1 || duration > 10080) {
            return interaction.reply({ 
                content: 'Invalid duration format. Use: `30s`, `5m`, `2h`, `1d` (or minutes as number, max 1 week)', 
                ephemeral: true 
            });
        }
        
        const winners = interaction.options.getInteger('winners') || 1;
        const minParticipants = interaction.options.getInteger('min_participants') || 0;

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

                // Check minimum participants requirement
                if (minParticipants > 0 && entries.size < minParticipants) {
                    const tauntMessages = [
                        `Y'all really let me down... only ${entries.size} out of ${minParticipants} needed entries. Do better next time! 😤`,
                        `Pathetic! Only ${entries.size} entries when we needed ${minParticipants}. Your community is sleeping... WAKE THEM UP! 🔥`,
                        `Giveaway CANCELLED! ${entries.size} entries? Really? You need ${minParticipants} minimum. Tell your friends, tag them, be more active! 💀`,
                        `Embarrassing... ${entries.size} of ${minParticipants} required. Y'all need to grind harder or find some more active members! 💪`,
                        `No winners today! Only ${entries.size} showed up when we needed ${minParticipants}. Go recruit some active people or start pinging! 📢`
                    ];
                    const randomTaunt = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];

                    const failedEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🚫 GIVEAWAY FAILED 🚫')
                        .setDescription(`**Prize:** ${prize}\n\n${randomTaunt}\n\n**Entries:** ${entries.size} / ${minParticipants} required`)
                        .setFooter({ text: 'Be more active next time!', iconURL: interaction.guild.iconURL() })
                        .setTimestamp();

                    await fetchedMessage.reply({ embeds: [failedEmbed] });

                    const endedEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🚫 GIVEAWAY CANCELLED 🚫')
                        .setDescription(`**Prize:** ${prize}\n\n**Status:** FAILED - Minimum not reached (${entries.size}/${minParticipants})\n\n~~React with 🎉 to enter!~~`)
                        .setFooter({ text: `Hosted by ${interaction.user.tag} | ${entries.size} entries`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    return await fetchedMessage.edit({ embeds: [endedEmbed] });
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
