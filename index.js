require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { OWNER_IDS } = require('./config/constants');
const { sendAsFloofWebhook } = require('./utils/webhook-util');
const { loadCommands, loadEvents } = require('./utils/commandLoader');
const { handleReactionAdd, handleReactionRemove } = require('./events/reactionRoles');
const { handleMessageDelete } = require('./events/messageDelete');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,  // Required for member update events
        GatewayIntentBits.GuildMessageReactions  // Required for reaction roles
    ] 
});

// Snipe system
client.snipes = new Map();
client.snipeList = new Map();

const ALLOWED_GUILD_IDS = ['1421592736221626572', '1392710210862321694']; // Section42 Discord servers (main + test)

// Load commands and events
const { commands, slashCommands, slashCommandsData } = loadCommands();
loadEvents(client);

// Store slashCommandsData on client for ready event
client.slashCommandsData = slashCommandsData;


client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(message.guild.id)) return;

    // Meowlock enforcement
    const { handleMeowlock } = require('./utils/meowlockHandler');
    const meowlockHandled = await handleMeowlock(message);
    if (meowlockHandled) return;

    // Owner command handling
    const { handleOwnerCommands } = require('./utils/ownerCommandHandler');
    const ownerCommandHandled = await handleOwnerCommands(message, client);
    if (ownerCommandHandled) return;

    // Command handling
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);
    if (command) {
        // Check if command is owner-only
        if (command.ownerOnly && !OWNER_IDS.includes(message.author.id)) {
            return;
        }
        
        try {
            command.execute(message, args);
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('There was an error executing this command!');
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!ALLOWED_GUILD_IDS.includes(interaction.guild.id)) return;

    // Handle button interactions for reaction roles
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('reactionrole_')) {
            await handleReactionRoleButton(interaction);
        }
        return;
    }

    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;
    
    const command = slashCommands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    // Check if command is owner-only
    if (command.ownerOnly && !OWNER_IDS.includes(interaction.user.id)) {
        return;
    }
    
    try {
        await command.executeSlash(interaction);
    } catch (error) {
        console.error('Error executing slash command:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Handle reaction role button clicks
async function handleReactionRoleButton(interaction) {
    const parts = interaction.customId.split('_');
    if (parts.length !== 3) return;
    
    const [, messageId, roleId] = parts;
    
    try {
        // Check if reaction role has expired
        const reactionRolesPath = require('path').join(__dirname, 'data', 'customReactionRoles.json');
        let reactionRoles = {};
        try {
            reactionRoles = require(reactionRolesPath);
        } catch (e) {
            // File doesn't exist yet
        }
        
        const config = reactionRoles[messageId];
        if (config && config.ended) {
            return interaction.reply({
                content: 'This reaction role message has ended. You can no longer claim roles from it.',
                ephemeral: true
            });
        }
        
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const role = await interaction.guild.roles.fetch(roleId);
        
        if (!role) {
            return interaction.reply({
                content: 'This role no longer exists.',
                ephemeral: true
            });
        }

        // Toggle role
        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(role);
            await interaction.reply({
                content: `Removed role: **${role.name}**`,
                ephemeral: true
            });
        } else {
            await member.roles.add(role);
            await interaction.reply({
                content: `Added role: **${role.name}**`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Reaction role error:', error);
        await interaction.reply({
            content: 'Failed to update roles. I may not have permission.',
            ephemeral: true
        });
    }
}

// Handle reaction add
client.on('messageReactionAdd', async (reaction, user) => {
    await handleReactionAdd(reaction, user, ALLOWED_GUILD_IDS);
});

// Handle reaction remove
client.on('messageReactionRemove', async (reaction, user) => {
    await handleReactionRemove(reaction, user, ALLOWED_GUILD_IDS);
});

// Message delete event for snipe
client.on('messageDelete', async (message) => {
    handleMessageDelete(message, client, ALLOWED_GUILD_IDS);
});

client.login(process.env.DISCORD_TOKEN);
