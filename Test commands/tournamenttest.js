const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { getDataPath } = require('../utils/dataPath');

// Import shared tournament utilities from main tournament command
const tournament = require(path.join(__dirname, '..', 'commands', 'tournament'));
const { activeTournaments, handleTournamentButton } = tournament;

// We need access to internal functions, so we'll require the file and use its exports
// But since tournament.js doesn't export everything we need, we'll duplicate the test logic here
// and import what we can

const fs = require('fs');

// Store reference to the tournament module's internals
const tournamentsFile = getDataPath('tournaments.json');

module.exports = {
    name: 'tournamenttest',
    description: 'Test a full interactive tournament with mock players',
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName('tournamenttest')
        .setDescription('Test a full interactive tournament with mock players')
        .addIntegerOption(option =>
            option.setName('players')
                .setDescription('Number of mock players (default: 16)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(64))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Tournament title for the test')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('Prize for the test')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(message, args) {
        return message.reply('Use the slash command `/tournamenttest` instead.');
    },

    async executeSlash(interaction) {
        const { generateBracket, formatBracket, createTournamentButtons, saveTournaments } = require(path.join(__dirname, '..', 'commands', 'tournament'));

        const playerCount = interaction.options.getInteger('players') || 16;
        const title = interaction.options.getString('title') || 'Test Tournament';
        const prize = interaction.options.getString('prize') || null;

        // Generate mock player names
        const mockNames = [
            'ShadowBlade', 'IronFist', 'DarkVoyager', 'StormBreaker', 'NightHawk',
            'ThunderWolf', 'CrimsonKing', 'FrostBite', 'PhantomX', 'ViperStrike',
            'BlazeFury', 'SteelNerve', 'GhostRider', 'DragonSlayer', 'WildCard',
            'DeathStroke', 'RavenClaw', 'WarHammer', 'SilentKill', 'NovaFlare',
            'VoidWalker', 'AshBringer', 'SoulReaper', 'IceWraith', 'HellFire',
            'NeonBlade', 'MoonWalker', 'StarDust', 'BoneBreaker', 'SkullCrusher',
            'SerpentFang', 'WolfBane', 'HawkEye', 'JetStream', 'QuakeFist',
            'TidalWave', 'EarthShaker', 'WindRunner', 'SunStrike', 'DarkMatter',
            'CosmicRay', 'AtomSmasher', 'ChainBreaker', 'RiftWalker', 'OmegaForce',
            'PrimalFury', 'AbyssLord', 'ChaosAgent', 'ZeroGravity', 'InfinityEdge',
            'ShadowStep', 'RuneKnight', 'BloodMoon', 'IronClad', 'StormCaller',
            'FlameTongue', 'FrostFang', 'ThunderClap', 'NightShade', 'DawnBringer',
            'TwilightFang', 'EmberHeart', 'GaleForce', 'TerraForge'
        ];

        // Pick random names for the player count
        const shuffledNames = [...mockNames].sort(() => Math.random() - 0.5).slice(0, playerCount);

        const mockParticipants = shuffledNames.map((name, i) => ({
            userId: `mock_${i}`,
            username: name,
            globalName: name
        }));

        await interaction.reply({ content: 'Creating test tournament...', ephemeral: true });

        // Build participant list
        const participantList = mockParticipants.map((p, index) => `${index + 1}. **${p.username}**`).join('\n');

        // Post roster embed
        const rosterEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle(`${title} - SIGNUPS CLOSED`)
            .setDescription(`**${playerCount} participants registered**\n\nBracket generated below.`)
            .addFields({ name: 'Participants', value: participantList.length <= 1024 ? participantList : participantList.slice(0, 1020) + '...', inline: false });

        if (prize) {
            rosterEmbed.addFields({ name: 'Prize', value: prize, inline: false });
        }

        rosterEmbed
            .setFooter({ text: `Test tournament hosted by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const rosterMessage = await interaction.channel.send({ embeds: [rosterEmbed] });

        // Generate bracket and create a real tournament entry
        const bracket = generateBracket(mockParticipants);

        const tournamentData = {
            messageId: rosterMessage.id,
            channelId: interaction.channel.id,
            guildId: interaction.guild.id,
            title: title,
            description: 'Test tournament with mock players',
            prize: prize || null,
            maxParticipants: playerCount,
            hostId: interaction.user.id,
            participants: new Map(mockParticipants.map(p => [p.userId, p])),
            phase: 'active',
            bracket: bracket,
            createdAt: Date.now(),
            closesAt: null,
            isTest: true
        };

        // Post bracket with buttons
        const bracketEmbed = formatBracket(tournamentData);
        const buttons = createTournamentButtons(tournamentData, rosterMessage.id);

        const bracketMessage = await interaction.channel.send({
            embeds: [bracketEmbed],
            components: buttons
        });

        tournamentData.bracketMessageId = bracketMessage.id;

        // Store in active tournaments so buttons work
        activeTournaments.set(rosterMessage.id, tournamentData);
        saveTournaments();
    }
};
