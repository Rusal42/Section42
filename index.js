require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const { OWNER_IDS } = require('./config/constants');
const messageTracker = require('./utils/messageTracker');
const fs = require('fs');
const path = require('path');

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

    // Restore reaction roles on startup
    console.log('🔄 Checking for reaction role messages to restore...');
    for (const guildId of ALLOWED_GUILD_IDS) {
        try {
            const guild = await client.guilds.fetch(guildId);
            const trackedMessages = messageTracker.getAllMessages(guildId);
            
            // Check for reaction role messages
            const reactionRoleTypes = ['reaction_roles_gender', 'reaction_roles_color'];
            
            for (const messageType of reactionRoleTypes) {
                if (trackedMessages[messageType]) {
                    const { channelId, messageId } = trackedMessages[messageType];
                    
                    try {
                        const channel = await guild.channels.fetch(channelId);
                        const message = await channel.messages.fetch(messageId);
                        
                        // Process all reactions on this message
                        for (const [emoji, reaction] of message.reactions.cache) {
                            const roleName = reactionRoleMap[emoji];
                            if (!roleName) continue;
                            
                            const role = guild.roles.cache.find(r => r.name === roleName);
                            if (!role) continue;
                            
                            // Fetch all users who reacted
                            const users = await reaction.users.fetch();
                            
                            for (const [userId, user] of users) {
                                if (user.bot) continue;
                                
                                try {
                                    const member = await guild.members.fetch(userId);
                                    
                                    // Check if member already has the role
                                    if (!member.roles.cache.has(role.id)) {
                                        // If it's a color role, remove other color roles first
                                        if (colorRoles.includes(roleName)) {
                                            const memberColorRoles = member.roles.cache.filter(r => colorRoles.includes(r.name));
                                            for (const [, colorRole] of memberColorRoles) {
                                                await member.roles.remove(colorRole);
                                            }
                                        }
                                        
                                        await member.roles.add(role);
                                        console.log(`✅ Restored ${roleName} role to ${user.tag}`);
                                    }
                                } catch (error) {
                                    console.error(`Error restoring role for ${user.tag}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching message ${messageType}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing guild ${guildId}:`, error);
        }
    }
    console.log('✅ Reaction role restoration complete!');
});

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

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!ALLOWED_GUILD_IDS.includes(message.guild.id)) return;

    // Meowlock enforcement
    const fs = require('fs');
    const meowlockPath = path.join(__dirname, 'data/meowlock.json');
    if (fs.existsSync(meowlockPath)) {
        try {
            const allLocks = JSON.parse(fs.readFileSync(meowlockPath, 'utf8') || '{}');
            const guildLocks = allLocks[message.guild.id] || [];
            const userLock = guildLocks.find(entry => entry.id === message.author.id);
            
            if (userLock) {
                // Allow commands to pass through
                if (message.content.startsWith('!')) return;
                
                try {
                    // Transform message into cat-speak
                    let catMessage = message.content;
                    
                    if (userLock.style === 'nya') {
                        // Nya style: subtle uwu transformations
                        catMessage = catMessage
                            .replace(/r|l/gi, match => match === match.toUpperCase() ? 'W' : 'w')
                            .replace(/(?:th)/gi, 'd')
                            .replace(/(?:ove)/gi, 'uv')
                            .replace(/[.!?]+/g, match => match + ' nya~');
                    } else {
                        // Meow style: subtle uwu transformations
                        catMessage = catMessage
                            .replace(/r|l/gi, match => match === match.toUpperCase() ? 'W' : 'w')
                            .replace(/(?:th)/gi, 'd')
                            .replace(/(?:ove)/gi, 'uv')
                            .replace(/[.!?]+/g, match => match + ' meow~');
                    }
                    
                    // Delete the original message
                    await message.delete();
                    
                    // Create webhook to send message as the user
                    const webhooks = await message.channel.fetchWebhooks();
                    let webhook = webhooks.find(wh => wh.name === 'Meowlock');
                    
                    if (!webhook) {
                        webhook = await message.channel.createWebhook({
                            name: 'Meowlock',
                            reason: 'Meowlock enforcement'
                        });
                    }
                    
                    // Send the transformed message as the user
                    await webhook.send({
                        content: catMessage,
                        username: message.author.username,
                        avatarURL: message.author.displayAvatarURL()
                    });
                } catch (err) {
                    console.error('Error enforcing meowlock:', err);
                }
                return;
            }
        } catch (err) {
            console.error('Error reading meowlock data:', err);
        }
    }

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

// Message delete event for snipe
client.on('messageDelete', async (message) => {
    if (!ALLOWED_GUILD_IDS.includes(message.guild.id)) return;
    if (message.author.bot) return;

    const snipeData = {
        content: message.content,
        author: message.author,
        deletedAt: new Date(),
        attachment: message.attachments.first()?.url || null
    };

    client.snipes.set(message.channel.id, snipeData);

    if (!client.snipeList.has(message.channel.id)) {
        client.snipeList.set(message.channel.id, []);
    }

    const channelSnipes = client.snipeList.get(message.channel.id);
    channelSnipes.unshift(snipeData);

    if (channelSnipes.length > 10) {
        channelSnipes.pop();
    }
});

// Welcome message event
const { EmbedBuilder } = require('discord.js');

client.on('guildMemberAdd', async (member) => {
    if (!ALLOWED_GUILD_IDS.includes(member.guild.id)) return;

    const welcomeChannel = member.guild.channels.cache.find(
        channel => channel.name === 'welcome'
    );

    if (!welcomeChannel) {
        console.log('Welcome channel not found');
        return;
    }

    try {
        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('Welcome to Section42!')
            .setDescription(`${member} has joined the server! 🎉\n\nMake sure to check out <#${member.guild.channels.cache.find(c => c.name === 'rules')?.id || 'rules'}> and get your roles!`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await welcomeChannel.send({ content: `${member}`, embeds: [embed] });
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
