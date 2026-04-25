const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Store active giveaways (shared across commands)
const activeGiveaways = new Map();

function parseDuration(input) {
    const match = input.match(/^(\d+)([smhd])$/i);
    if (!match) {
        const num = parseInt(input);
        return isNaN(num) ? null : num;
    }
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 's': return Math.ceil(value / 60);
        case 'm': return value;
        case 'h': return value * 60;
        case 'd': return value * 1440;
        default: return null;
    }
}

module.exports = {
    name: 'giveaway-start',
    description: 'Start a giveaway',
    activeGiveaways,
    data: new SlashCommandBuilder()
        .setName('giveaway-start')
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

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to start giveaways.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        const prize = interaction.options.getString('prize');
        const durationInput = interaction.options.getString('duration');
        const duration = parseDuration(durationInput);

        if (!duration || duration < 1 || duration > 10080) {
            return interaction.reply({
                content: 'Invalid duration format. Use: `30s`, `5m`, `2h`, `1d` (or minutes as number, max 1 week)',
                flags: 64
            });
        }

        const winners = interaction.options.getInteger('winners') || 1;
        const minParticipants = interaction.options.getInteger('min_participants') || 0;

        const endTime = Date.now() + (duration * 60 * 1000);
        const endTimestamp = Math.floor(endTime / 1000);

        const giveawayEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('GIVEAWAY')
            .setDescription(`**Prize:** ${prize}\n\n**Winners:** ${winners}\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n\nReact with 1 to enter!`)
            .setFooter({ text: `Hosted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(endTime);

        await interaction.reply({ embeds: [giveawayEmbed] });
        const giveawayMessage = await interaction.fetchReply();
        await giveawayMessage.react('1️⃣');

        const giveawayId = giveawayMessage.id;

        const timeoutId = setTimeout(async () => {
            try {
                await endGiveaway(interaction.client, giveawayId, interaction.channelId);
            } catch (error) {
                console.error('Error auto-ending giveaway:', error);
            }
        }, duration * 60 * 1000);

        activeGiveaways.set(giveawayId, {
            messageId: giveawayId,
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            prize,
            winners,
            minParticipants,
            hostId: interaction.user.id,
            timeoutId,
            ended: false
        });

        await interaction.followUp({
            content: `Giveaway started! Message ID: \`${giveawayId}\` (use this to end/cancel early)`,
            flags: 64
        });
    }
};

async function endGiveaway(client, giveawayId, channelId) {
    const giveaway = activeGiveaways.get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;

    try {
        const channel = await client.channels.fetch(channelId);
        const fetchedMessage = await channel.messages.fetch(giveawayId);
        const reaction = fetchedMessage.reactions.cache.get('1️⃣');

        if (!reaction) {
            const noReactionEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Giveaway Ended')
                .setDescription(`**Prize:** ${giveaway.prize}\n\nNo valid entries!`)
                .setTimestamp();
            await fetchedMessage.reply({ embeds: [noReactionEmbed] });
            activeGiveaways.delete(giveawayId);
            return;
        }

        const users = await reaction.users.fetch();
        const entries = users.filter(user => !user.bot);

        if (entries.size === 0) {
            const noEntriesEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Giveaway Ended')
                .setDescription(`**Prize:** ${giveaway.prize}\n\nNo valid entries!`)
                .setTimestamp();
            await fetchedMessage.reply({ embeds: [noEntriesEmbed] });
            activeGiveaways.delete(giveawayId);
            return;
        }

        if (giveaway.minParticipants > 0 && entries.size < giveaway.minParticipants) {
            const tauntMessages = [
                `Y'all really let me down... only ${entries.size} out of ${giveaway.minParticipants} needed entries. Do better next time!`,
                `Pathetic! Only ${entries.size} entries when we needed ${giveaway.minParticipants}. Your community is sleeping... WAKE THEM UP!`,
                `Giveaway CANCELLED! ${entries.size} entries? Really? You need ${giveaway.minParticipants} minimum. Tell your friends, tag them, be more active!`,
                `Embarrassing... ${entries.size} of ${giveaway.minParticipants} required. Y'all need to grind harder or find some more active members!`,
                `No winners today! Only ${entries.size} showed up when we needed ${giveaway.minParticipants}. Go recruit some active people or start pinging!`
            ];
            const randomTaunt = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];

            const failedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('GIVEAWAY FAILED')
                .setDescription(`**Prize:** ${giveaway.prize}\n\n${randomTaunt}\n\n**Entries:** ${entries.size} / ${giveaway.minParticipants} required`)
                .setFooter({ text: 'Be more active next time!', iconURL: fetchedMessage.guild.iconURL() })
                .setTimestamp();

            await fetchedMessage.reply({ embeds: [failedEmbed] });

            const endedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('GIVEAWAY CANCELLED')
                .setDescription(`**Prize:** ${giveaway.prize}\n\n**Status:** FAILED - Minimum not reached (${entries.size}/${giveaway.minParticipants})\n\n~~Click to enter!~~`)
                .setFooter({ text: `Hosted by ${giveaway.hostId} | ${entries.size} entries` })
                .setTimestamp();

            await fetchedMessage.edit({ embeds: [endedEmbed] });
            activeGiveaways.delete(giveawayId);
            return;
        }

        const winnerCount = Math.min(giveaway.winners, entries.size);
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
            .setTitle('Giveaway Ended!')
            .setDescription(`**Prize:** ${giveaway.prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\nCongratulations!`)
            .setFooter({ text: `${entries.size} total entries`, iconURL: fetchedMessage.guild.iconURL() })
            .setTimestamp();

        await fetchedMessage.reply({ content: winnerMentions, embeds: [winnerEmbed] });

        const endedEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('GIVEAWAY ENDED')
            .setDescription(`**Prize:** ${giveaway.prize}\n\n**Winner${winnerCount > 1 ? 's' : ''}:** ${winnerMentions}\n\n~~Click to enter!~~`)
            .setFooter({ text: `Hosted by ${giveaway.hostId} | ${entries.size} entries` })
            .setTimestamp();

        await fetchedMessage.edit({ embeds: [endedEmbed] });
        activeGiveaways.delete(giveawayId);

    } catch (error) {
        console.error('Error ending giveaway:', error);
        activeGiveaways.delete(giveawayId);
    }
}

module.exports.endGiveaway = endGiveaway;
