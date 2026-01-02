
require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,  // Required for member update events
        GatewayIntentBits.GuildMessageReactions  // Required for reaction roles
    ] 
});

const ALLOWED_GUILD_IDS = ['1421592736221626572', '1392710210862321694']; // Section42 Discord servers (main + test)
const { OWNER_IDS } = require('./config/constants');

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Owner IDs: ${OWNER_IDS.join(', ')}`);
    
    if (slashCommandsData.length > 0) {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        try {
            console.log(`Started refreshing ${slashCommandsData.length} application (/) commands.`);
            
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: slashCommandsData },
            );
            
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }
});

const fs = require('fs');
const path = require('path');
const { sendAsFloofWebhook } = require('./utils/webhook-util');

const commands = new Map();
const slashCommands = new Collection();
const slashCommandsData = [];

const commandDirectories = ['commands', 'ServerCreation', 'ownercommands', 'moderationcommands'];

commandDirectories.forEach(dirName => {
    const dirPath = path.join(__dirname, dirName);
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require(path.join(dirPath, file));
                commands.set(command.name, command);
                console.log(`Loaded command: ${command.name} (ownerOnly: ${command.ownerOnly || false})`);
                
                if (command.data) {
                    slashCommands.set(command.data.name, command);
                    slashCommandsData.push(command.data.toJSON());
                }
            }
        });
    }
});

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        
        console.log(`Loaded event: ${event.name}`);
    }
}

client.on('messageCreate', message => {
    if (!ALLOWED_GUILD_IDS.includes(message.guild.id) || !message.content.startsWith('!') || message.author.bot) return;
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
    if (!interaction.isChatInputCommand() || !ALLOWED_GUILD_IDS.includes(interaction.guild.id)) return;
    
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

// Reaction role mappings
const reactionRoleMap = {
    // Gender roles (using different emojis to avoid conflicts)
    '♂️': 'Male',
    '♀️': 'Female',
    // Color roles
    '🔴': 'Red',
    '🟠': 'Orange',
    '🟡': 'Yellow',
    '🟢': 'Green',
    '🔵': 'Blue',
    '🟣': 'Purple',
    '🩷': 'Pink',
    '⚪': 'White',
    '⚫': 'Black'
};

const colorRoles = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'White', 'Black'];

// Handle reaction add
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(reaction.message.guild.id)) return;

    // Fetch partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const emoji = reaction.emoji.name;
    const roleName = reactionRoleMap[emoji];

    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    try {
        // If it's a color role, remove all other color roles first
        if (colorRoles.includes(roleName)) {
            const memberColorRoles = member.roles.cache.filter(r => colorRoles.includes(r.name));
            for (const [, colorRole] of memberColorRoles) {
                await member.roles.remove(colorRole);
            }
        }

        await member.roles.add(role);
        console.log(`Added ${roleName} role to ${user.tag}`);
    } catch (error) {
        console.error(`Error adding role ${roleName} to ${user.tag}:`, error);
    }
});

// Handle reaction remove
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(reaction.message.guild.id)) return;

    // Fetch partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const emoji = reaction.emoji.name;
    const roleName = reactionRoleMap[emoji];

    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    try {
        await member.roles.remove(role);
        console.log(`Removed ${roleName} role from ${user.tag}`);
    } catch (error) {
        console.error(`Error removing role ${roleName} from ${user.tag}:`, error);
    }
});

client.login(process.env.DISCORD_TOKEN);
