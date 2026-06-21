const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Store active tournaments in memory
const activeTournaments = new Map();

// Store active auto-close timeouts (not persisted)
const activeTimeouts = new Map();

// Load persisted tournaments on startup
const tournamentsFile = path.join(__dirname, '..', 'data', 'tournaments.json');
function hydrateTournament(value) {
    const tournament = { ...value };
    if (value.participants) {
        tournament.participants = new Map(Object.entries(value.participants));
    } else {
        tournament.participants = new Map();
    }
    if (value.bracket) {
        tournament.bracket = {
            ...value.bracket,
            matches: value.bracket.matches || [],
            eliminated: value.bracket.eliminated || []
        };
    }
    tournament.prize = value.prize || null;
    tournament.closesAt = value.closesAt || null;
    delete tournament.closeTimeout;
    return tournament;
}

function loadTournaments() {
    try {
        if (fs.existsSync(tournamentsFile)) {
            const data = JSON.parse(fs.readFileSync(tournamentsFile, 'utf8'));
            for (const [key, value] of Object.entries(data)) {
                activeTournaments.set(key, hydrateTournament(value));
            }
        }
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

// Save tournaments to file
function saveTournaments() {
    try {
        const data = {};
        for (const [key, tournament] of activeTournaments) {
            data[key] = {
                ...tournament,
                participants: Object.fromEntries(tournament.participants)
            };
        }
        fs.writeFileSync(tournamentsFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving tournaments:', error);
    }
}

// Load on module load
loadTournaments();

// Parse duration strings like 5s, 5m, 5h, 5d
function parseDuration(input) {
    if (!input || typeof input !== 'string') return null;
    const match = input.trim().match(/^(\d+)([smhd])$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return value * multipliers[unit];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Helper function to generate bracket structure
function generateBracket(participants) {
    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Calculate rounds needed
    const rounds = Math.ceil(Math.log2(shuffled.length));
    const bracketSize = Math.pow(2, rounds);
    
    // Fill byes
    const byes = bracketSize - shuffled.length;
    const bracket = [];
    
    for (let i = 0; i < bracketSize; i++) {
        if (i < byes) {
            bracket.push({ userId: null, username: 'BYE', bye: true });
        } else {
            bracket.push(shuffled[i - byes]);
        }
    }
    
    return {
        rounds: rounds,
        currentRound: 1,
        matches: generateMatches(bracket, 1),
        allParticipants: shuffled,
        eliminated: [],
        champion: null
    };
}

function generateMatches(participants, round) {
    const matches = [];
    const matchCount = participants.length / 2;
    
    for (let i = 0; i < matchCount; i++) {
        const p1 = participants[i * 2];
        const p2 = participants[i * 2 + 1];
        
        matches.push({
            matchNumber: i + 1,
            round: round,
            player1: p1,
            player2: p2,
            winner: null,
            completed: false
        });
    }
    
    return matches;
}

function formatBracket(tournament) {
    const embed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle(`${tournament.title} - Round ${tournament.bracket.currentRound}`)
        .setDescription(tournament.description)
        .setTimestamp();
    
    if (tournament.prize) {
        embed.addFields({ name: '🏆 Prize', value: tournament.prize, inline: false });
    }
    
    if (tournament.bracket.champion) {
        embed.addFields({
            name: 'CHAMPION',
            value: `<@${tournament.bracket.champion.userId}> **${tournament.bracket.champion.username}**`,
            inline: false
        });
        embed.setColor('#FFD700');
        return embed;
    }
    
    const matches = tournament.bracket.matches.filter(m => m.round === tournament.bracket.currentRound);
    
    if (matches.length === 0 && tournament.bracket.currentRound > tournament.bracket.rounds) {
        embed.addFields({
            name: 'Status',
            value: 'Tournament is complete!',
            inline: false
        });
        return embed;
    }
    
    // Display current round matches
    for (const match of matches) {
        const p1Name = match.player1.bye ? 'BYE' : `**${match.player1.username}**`;
        const p2Name = match.player2.bye ? 'BYE' : `**${match.player2.username}**`;
        
        let status;
        if (match.completed) {
            const winner = match.winner === 'player1' ? p1Name : p2Name;
            status = `Winner: ${winner}`;
        } else if (match.player1.bye) {
            status = `${p2Name} gets a bye`;
        } else if (match.player2.bye) {
            status = `${p1Name} gets a bye`;
        } else {
            status = 'Waiting for result...';
        }
        
        embed.addFields({
            name: `Match ${match.matchNumber}`,
            value: `${p1Name} vs ${p2Name}\n${status}`,
            inline: true
        });
    }
    
    // Add eliminated players
    if (tournament.bracket.eliminated.length > 0) {
        const eliminatedList = tournament.bracket.eliminated
            .slice(-5)
            .map(p => p.username)
            .join(', ');
        embed.addFields({
            name: 'Recently Eliminated',
            value: eliminatedList || 'None yet',
            inline: false
        });
    }
    
    embed.setFooter({ 
        text: `Round ${tournament.bracket.currentRound} of ${tournament.bracket.rounds} | ${tournament.participants.size} total participants`,
        iconURL: 'https://i.imgur.com/deepwoken.png'
    });
    
    return embed;
}

function createTournamentButtons(tournament, messageId) {
    const matches = tournament.bracket.matches.filter(m => m.round === tournament.bracket.currentRound && !m.completed);
    
    if (matches.length === 0 || tournament.bracket.champion) return [];
    
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    for (const match of matches) {
        if (match.player1.bye || match.player2.bye) continue;
        
        // Match result buttons
        const p1Button = new ButtonBuilder()
            .setCustomId(`tournament_win_${messageId}_${match.matchNumber}_player1`)
            .setLabel(`${match.player1.username} wins`)
            .setStyle(ButtonStyle.Primary);
        
        const p2Button = new ButtonBuilder()
            .setCustomId(`tournament_win_${messageId}_${match.matchNumber}_player2`)
            .setLabel(`${match.player2.username} wins`)
            .setStyle(ButtonStyle.Primary);
        
        if (buttonCount + 2 > 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
            buttonCount = 0;
        }
        
        currentRow.addComponents(p1Button, p2Button);
        buttonCount += 2;
    }
    
    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }
    
    // Add control buttons
    const controlRow = new ActionRowBuilder();
    controlRow.addComponents(
        new ButtonBuilder()
            .setCustomId(`tournament_next_${messageId}`)
            .setLabel('Next Round')
            .setStyle(ButtonStyle.Success)
            .setDisabled(matches.some(m => !m.completed && !m.player1.bye && !m.player2.bye)),
        new ButtonBuilder()
            .setCustomId(`tournament_end_${messageId}`)
            .setLabel('End Tournament')
            .setStyle(ButtonStyle.Danger)
    );
    rows.push(controlRow);
    
    return rows;
}

module.exports = {
    name: 'tournament',
    description: 'Deepwoken tournament management',
    activeTournaments,
    data: new SlashCommandBuilder()
        .setName('tournament')
        .setDescription('Deepwoken tournament management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new tournament signup')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Tournament title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Tournament description/rules')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Signup duration, e.g. 5s, 5m, 5h, 5d')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Prize for the tournament winner')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('max_participants')
                        .setDescription('Maximum participants (default: 16)')
                        .setRequired(false)
                        .setMinValue(2)
                        .setMaxValue(64)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close signup and generate bracket')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The tournament signup message ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an active tournament')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The tournament message ID')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You need **Manage Messages** permission to run tournaments.');
        }

        if (args.length === 0) {
            return message.reply('Usage: `!tournament start <title> | <description> | [prize] | [duration] | [max_participants]`\nDuration format: `5s`, `5m`, `5h`, `5d`');
        }

        const subcommand = args[0].toLowerCase();

        if (subcommand === 'start') {
            await handleStartText(message, args.slice(1));
        } else if (subcommand === 'close') {
            await handleCloseText(message, args.slice(1));
        } else if (subcommand === 'cancel') {
            await handleCancelText(message, args.slice(1));
        } else {
            message.reply('Unknown subcommand. Use: `start`, `close`, or `cancel`');
        }
    },

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: 'You need **Manage Messages** permission to run tournaments.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            await handleStartSlash(interaction);
        } else if (subcommand === 'close') {
            await handleCloseSlash(interaction);
        } else if (subcommand === 'cancel') {
            await handleCancelSlash(interaction);
        }
    }
};

async function handleStartText(message, args) {
    const input = args.join(' ').split(' | ');
    const title = input[0] || 'Deepwoken Tournament';
    const description = input[1] || 'React with ✅ to enter the tournament!';
    let duration = null;
    let prize = null;
    let maxParticipants = 16;

    for (let i = 2; i < input.length; i++) {
        const part = input[i].trim();
        if (!part) continue;

        if (parseDuration(part) !== null) {
            duration = part;
        } else if (/^\d+$/.test(part)) {
            const n = parseInt(part, 10);
            if (n >= 2 && n <= 64) {
                maxParticipants = n;
            } else {
                prize = part;
            }
        } else {
            prize = part;
        }
    }

    await startTournament(message.channel, message.author, title, description, maxParticipants, message.guild.id, duration, prize);
}

async function handleStartSlash(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description') || 'React with ✅ to enter the tournament!';
    const duration = interaction.options.getString('duration');
    const prize = interaction.options.getString('prize');
    const maxParticipants = interaction.options.getInteger('max_participants') || 16;

    await interaction.reply({ content: 'Starting tournament...', ephemeral: true });
    await startTournament(interaction.channel, interaction.user, title, description, maxParticipants, interaction.guild.id, duration, prize);
}

async function startTournament(channel, host, title, description, maxParticipants, guildId, durationStr, prize) {
    const durationMs = parseDuration(durationStr);
    const closesAt = durationMs ? Date.now() + durationMs : null;

    let descriptionText = `${description}\n\n**React with ✅ to enter!**\n\nMax Participants: ${maxParticipants}`;
    if (prize) {
        descriptionText += `\n🏆 Prize: **${prize}**`;
    }
    if (closesAt) {
        descriptionText += `\n⏰ Signups close in ${formatDuration(durationMs)}`;
    }

    const signupEmbed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle(`${title} - SIGNUPS OPEN`)
        .setDescription(descriptionText)
        .setFooter({ text: `Hosted by ${host.username} | Tournament will close when full or manually`, iconURL: host.displayAvatarURL() })
        .setTimestamp();

    const signupMessage = await channel.send({ embeds: [signupEmbed] });
    await signupMessage.react('✅');

    const tournament = {
        messageId: signupMessage.id,
        channelId: channel.id,
        guildId: guildId,
        title: title,
        description: description,
        prize: prize || null,
        maxParticipants: maxParticipants,
        hostId: host.id,
        participants: new Map(),
        phase: 'signup',
        bracket: null,
        createdAt: Date.now(),
        closesAt: closesAt
    };

    activeTournaments.set(signupMessage.id, tournament);
    saveTournaments();

    if (durationMs) {
        const timeout = setTimeout(() => {
            autoCloseTournament(channel.client, tournament.messageId);
        }, durationMs);
        activeTimeouts.set(signupMessage.id, timeout);
    }

    await channel.send(`Tournament started! Message ID: \`${signupMessage.id}\` (use this to close signup with /tournament close or !tournament close)`);
}

async function autoCloseTournament(client, messageId) {
    const tournament = activeTournaments.get(messageId);
    if (!tournament || tournament.phase !== 'signup') {
        activeTimeouts.delete(messageId);
        return;
    }

    if (activeTimeouts.has(messageId)) {
        activeTimeouts.delete(messageId);
    }

    try {
        const channel = await client.channels.fetch(tournament.channelId);
        if (!channel) return;
        await closeTournament(channel, messageId, client.user);
    } catch (error) {
        console.error(`[Tournament] Auto-close failed for ${messageId}:`, error);
    }
}

function scheduleAutoCloses(client) {
    for (const [messageId, tournament] of activeTournaments) {
        if (tournament.phase !== 'signup' || !tournament.closesAt) continue;

        const remaining = tournament.closesAt - Date.now();
        if (activeTimeouts.has(messageId)) {
            clearTimeout(activeTimeouts.get(messageId));
            activeTimeouts.delete(messageId);
        }

        if (remaining <= 0) {
            autoCloseTournament(client, messageId);
        } else {
            const timeout = setTimeout(() => {
                autoCloseTournament(client, messageId);
            }, remaining);
            activeTimeouts.set(messageId, timeout);
        }
    }
}

async function handleCloseText(message, args) {
    const messageId = args[0];
    if (!messageId) {
        return message.reply('Please provide the tournament message ID: `!tournament close <message_id>`');
    }
    await closeTournament(message.channel, messageId, message.author);
}

async function handleCloseSlash(interaction) {
    const messageId = interaction.options.getString('message_id');
    await interaction.reply({ content: 'Closing tournament signup...', ephemeral: true });
    await closeTournament(interaction.channel, messageId, interaction.user);
}

async function closeTournament(channel, messageId, closer) {
    if (activeTimeouts.has(messageId)) {
        clearTimeout(activeTimeouts.get(messageId));
        activeTimeouts.delete(messageId);
    }

    const tournament = activeTournaments.get(messageId);
    if (!tournament) {
        return channel.send('Tournament not found. Make sure you copied the correct message ID.');
    }

    if (tournament.phase !== 'signup') {
        return channel.send('This tournament is already closed or completed.');
    }

    // Fetch the signup message and get participants
    try {
        const signupMessage = await channel.messages.fetch(messageId);
        const reaction = signupMessage.reactions.cache.get('✅');
        
        if (reaction) {
            const users = await reaction.users.fetch();
            for (const [, user] of users) {
                if (!user.bot) {
                    // Try to get guild nickname, fallback to username
                    const member = await channel.guild.members.fetch(user.id).catch(() => null);
                    const displayName = member ? (member.nickname || user.username) : user.username;
                    
                    tournament.participants.set(user.id, {
                        userId: user.id,
                        username: displayName,
                        globalName: user.username
                    });
                }
            }
        }

        if (tournament.participants.size < 2) {
            return channel.send(`Not enough participants! Only ${tournament.participants.size} signed up. Need at least 2.`);
        }

        // Cap at max participants
        const allParticipants = Array.from(tournament.participants.values()).slice(0, tournament.maxParticipants);
        tournament.participants = new Map(allParticipants.map(p => [p.userId, p]));

        // Generate bracket
        tournament.bracket = generateBracket(allParticipants);
        tournament.phase = 'active';

        // Build participant list
        const participantList = allParticipants.map((p, index) => `${index + 1}. <@${p.userId}> **${p.username}**`).join('\n');

        // Update signup message
        const closedEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle(`${tournament.title} - SIGNUPS CLOSED`)
            .setDescription(`**${tournament.participants.size} participants registered**\n\nTournament has begun!`)
            .addFields({ name: 'Participants', value: participantList || 'None', inline: false });

        if (tournament.prize) {
            closedEmbed.addFields({ name: '🏆 Prize', value: tournament.prize, inline: false });
        }

        closedEmbed
            .setFooter({ text: `Hosted by ${closer.username}`, iconURL: closer.displayAvatarURL() })
            .setTimestamp();

        await signupMessage.edit({ embeds: [closedEmbed] });

        // Send bracket message
        const bracketEmbed = formatBracket(tournament);
        const buttons = createTournamentButtons(tournament, messageId);
        
        const prizeLine = tournament.prize ? `🏆 Prize: **${tournament.prize}**\n` : '';
        const bracketMessage = await channel.send({
            content: `${prizeLine}🏆 **${tournament.title}** has begun! Good luck to all ${tournament.participants.size} participants!`,
            embeds: [bracketEmbed],
            components: buttons
        });

        tournament.bracketMessageId = bracketMessage.id;
        saveTournaments();

        await channel.send(`Use the buttons on the bracket message to report match winners!`);

    } catch (error) {
        console.error('Error closing tournament:', error);
        channel.send('Error closing tournament. The message may have been deleted.');
    }
}

async function handleCancelText(message, args) {
    const messageId = args[0];
    if (!messageId) {
        return message.reply('Please provide the tournament message ID: `!tournament cancel <message_id>`');
    }
    await cancelTournament(message.channel, messageId);
}

async function handleCancelSlash(interaction) {
    const messageId = interaction.options.getString('message_id');
    await interaction.reply({ content: 'Cancelling tournament...', ephemeral: true });
    await cancelTournament(interaction.channel, messageId);
}

async function cancelTournament(channel, messageId) {
    const tournament = activeTournaments.get(messageId);
    if (!tournament) {
        return channel.send('Tournament not found.');
    }

    if (activeTimeouts.has(messageId)) {
        clearTimeout(activeTimeouts.get(messageId));
        activeTimeouts.delete(messageId);
    }

    activeTournaments.delete(messageId);
    saveTournaments();

    try {
        const signupMessage = await channel.messages.fetch(messageId);
        const cancelledEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`⚔️ ${tournament.title} - CANCELLED`)
            .setDescription('This tournament has been cancelled.')
            .setTimestamp();
        await signupMessage.edit({ embeds: [cancelledEmbed] });
    } catch (error) {
        console.error('Error updating cancelled tournament:', error);
    }

    channel.send('Tournament cancelled successfully.');
}

// Handle button interactions for tournament management
async function handleTournamentButton(interaction) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    
    if (parts[0] !== 'tournament') return;
    
    const action = parts[1];
    const messageId = parts[2];
    
    const tournament = activeTournaments.get(messageId);
    if (!tournament) {
        return interaction.reply({ content: 'Tournament not found or has ended.', ephemeral: true });
    }
    
    // Only host and admins can control tournament
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && 
        interaction.user.id !== tournament.hostId) {
        return interaction.reply({ content: 'Only the tournament host or moderators can control this tournament.', ephemeral: true });
    }
    
    if (action === 'win') {
        const matchNumber = parseInt(parts[3]);
        const winner = parts[4]; // player1 or player2
        
        await handleMatchWin(interaction, tournament, messageId, matchNumber, winner);
    } else if (action === 'next') {
        await handleNextRound(interaction, tournament, messageId);
    } else if (action === 'end') {
        await handleEndTournament(interaction, tournament, messageId);
    }
}

async function handleMatchWin(interaction, tournament, messageId, matchNumber, winner) {
    const match = tournament.bracket.matches.find(m => m.matchNumber === matchNumber && m.round === tournament.bracket.currentRound);
    if (!match || match.completed) {
        return interaction.reply({ content: 'Match not found or already completed.', ephemeral: true });
    }
    
    // Handle bye matches
    if (match.player1.bye) {
        match.winner = 'player2';
        match.completed = true;
    } else if (match.player2.bye) {
        match.winner = 'player1';
        match.completed = true;
    } else {
        match.winner = winner;
        match.completed = true;
        
        // Add loser to eliminated
        const loser = winner === 'player1' ? match.player2 : match.player1;
        tournament.bracket.eliminated.push(loser);
    }
    
    saveTournaments();
    
    await updateBracketMessage(interaction, tournament, messageId);
    await interaction.reply({ content: `Match ${matchNumber} winner recorded!`, ephemeral: true });
}

async function handleNextRound(interaction, tournament, messageId) {
    const currentMatches = tournament.bracket.matches.filter(m => m.round === tournament.bracket.currentRound);
    const incompleteMatches = currentMatches.filter(m => !m.completed && !m.player1.bye && !m.player2.bye);
    
    if (incompleteMatches.length > 0) {
        return interaction.reply({ content: 'Cannot advance - not all matches are complete!', ephemeral: true });
    }
    
    // Collect winners
    const winners = currentMatches.map(match => {
        if (match.player1.bye) return match.player2;
        if (match.player2.bye) return match.player1;
        return match.winner === 'player1' ? match.player1 : match.player2;
    });
    
    // Check if this was the final round
    if (winners.length === 1) {
        tournament.bracket.champion = winners[0];
        tournament.phase = 'completed';
        saveTournaments();
        
        await updateBracketMessage(interaction, tournament, messageId);
        
        // Announce champion
        const prizeText = tournament.prize ? `\n\n🏆 Prize: **${tournament.prize}**` : '';
        await interaction.channel.send({
            content: `**${tournament.title} CHAMPION**\n\nCongratulations to <@${winners[0].userId}> **${winners[0].username}**!${prizeText}`,
            allowedMentions: { users: [winners[0].userId] }
        });
        
        return interaction.reply({ content: 'Tournament complete! Champion crowned!', ephemeral: true });
    }
    
    // Advance to next round
    tournament.bracket.currentRound++;
    const newMatches = generateMatches(winners, tournament.bracket.currentRound);
    tournament.bracket.matches.push(...newMatches);
    
    saveTournaments();
    
    await updateBracketMessage(interaction, tournament, messageId);
    await interaction.reply({ content: `Advanced to Round ${tournament.bracket.currentRound}!`, ephemeral: true });
}

async function handleEndTournament(interaction, tournament, messageId) {
    tournament.phase = 'cancelled';
    saveTournaments();
    
    await updateBracketMessage(interaction, tournament, messageId);
    await interaction.reply({ content: 'Tournament has been ended.', ephemeral: true });
}

async function updateBracketMessage(interaction, tournament, messageId) {
    try {
        const bracketEmbed = formatBracket(tournament);
        const buttons = createTournamentButtons(tournament, messageId);
        
        await interaction.message.edit({
            embeds: [bracketEmbed],
            components: buttons
        });
    } catch (error) {
        console.error('Error updating bracket message:', error);
    }
}

// Export the handler for button interactions
module.exports.handleTournamentButton = handleTournamentButton;
module.exports.scheduleAutoCloses = scheduleAutoCloses;
