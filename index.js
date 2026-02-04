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

const commandDirectories = ['commands', 'commands/fun-commands', 'ServerCreation', 'ownercommands', 'moderationcommands'];

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
                try {
                    // Check for mentions and GIFs - block them entirely
                    // Special case: @crucifyym mentions get transformed to "daddy"
                    const crucifyymMention = message.mentions.users.find(u => u.id === 'crucifyym' || u.username.toLowerCase() === 'crucifyym');
                    
                    if ((message.mentions.users.size > 0 || message.mentions.roles.size > 0) && !crucifyymMention) {
                        await message.delete();
                        const warningMessage = await message.channel.send({
                            content: `${message.author}, pings and GIFs are not allowed while meowlocked! ${userLock.style === 'nya' ? 'Nya! 🐱' : 'Meow! 🐱'}`,
                            allowedMentions: { users: [] }
                        });
                        
                        // Delete warning after 3 seconds
                        setTimeout(() => warningMessage.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    if (message.attachments.some(att => att.contentType && att.contentType.startsWith('image/')) ||
                        message.content.includes('tenor.com') || message.content.includes('giphy.com') ||
                        message.content.includes('.gif') || message.content.includes('giphy')) {
                        
                        await message.delete();
                        const warningMessage = await message.channel.send({
                            content: `${message.author}, pings and GIFs are not allowed while meowlocked! ${userLock.style === 'nya' ? 'Nya! 🐱' : 'Meow! 🐱'}`,
                            allowedMentions: { users: [] }
                        });
                        
                        // Delete warning after 3 seconds
                        setTimeout(() => warningMessage.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    // Transform message into uwu/cat-speak
                    let catMessage = message.content;
                    const tagWord = userLock.style === 'nya' ? 'nya' : 'meow';
                    
                    // Special case: Replace @crucifyym mentions with "daddy"
                    if (crucifyymMention) {
                        catMessage = catMessage.replace(/<@!?(\d+)>/g, (match, id) => {
                            const mentionedUser = message.mentions.users.get(id);
                            if (mentionedUser && (mentionedUser.id === 'crucifyym' || mentionedUser.username.toLowerCase() === 'crucifyym')) {
                                return 'daddy';
                            }
                            return match;
                        });
                    }

                    // Profanity filtering - transform bad words into innocent/pouty alternatives
                    const profanityFilter = [
                        [/\bfuck\b/gi, 'frick'],
                        [/\bfucking\b/gi, 'freaking'],
                        [/\bfucked\b/gi, 'messed up'],
                        [/\bshit\b/gi, 'crap'],
                        [/\bshitty\b/gi, 'crappy'],
                        [/\bass\b/gi, 'butt'],
                        [/\basshole\b/gi, 'jerk'],
                        [/\bbitch\b/gi, 'meanie'],
                        [/\bcunt\b/gi, 'meanie'],
                        [/\bdick\b/gi, 'jerk'],
                        [/\bpussy\b/gi, 'scaredy-cat'],
                        [/\bcock\b/gi, 'meanie'],
                        [/\bwhore\b/gi, 'meanie'],
                        [/\bslut\b/gi, 'meanie'],
                        [/\bdamn\b/gi, 'darn'],
                        [/\bhell\b/gi, 'heck'],
                        [/\bbastard\b/gi, 'meanie'],
                        [/\bmotherfucker\b/gi, 'big meanie'],
                        [/\bson of a bitch\b/gi, 'meanie pants'],
                        [/\bgoddammit\b/gi, 'goshdarnit'],
                        [/\bchrist\b/gi, 'gosh'],
                        [/\bjesus\b/gi, 'jeez'],
                        [/\bwtf\b/gi, 'what the heck'],
                        [/\bwth\b/gi, 'what the heck'],
                        [/\bstfu\b/gi, 'be quiet'],
                        [/\bidiot\b/gi, 'silly'],
                        [/\bstupid\b/gi, 'silly'],
                        [/\bdumb\b/gi, 'silly'],
                        [/\bretard\b/gi, 'silly'],
                        [/\bkill\b/gi, 'hug'],
                        [/\bdie\b/gi, 'go away'],
                        [/\bdeath\b/gi, 'nap time'],
                        [/\bmurder\b/gi, 'big hug'],
                        [/\brape\b/gi, 'big no-no'],
                        [/\bnazi\b/gi, 'meanie'],
                        [/\bhitler\b/gi, 'meanie'],
                    ];

                    for (const [re, rep] of profanityFilter) {
                        catMessage = catMessage.replace(re, rep);
                    }

                    // Expanded uwu vocabulary swaps - more cringe and harder to speak normally
                    const vocab = [
                        [/\bplease\b/gi, 'pwease'],
                        [/\bpls\b/gi, 'pwease'],
                        [/\bsorry\b/gi, 'sowwy'],
                        [/\bapologize\b/gi, 'apowogize'],
                        [/\bsmall\b/gi, 'smol'],
                        [/\blittle\b/gi, 'wittle'],
                        [/\bcute\b/gi, 'cutie'],
                        [/\badorable\b/gi, 'adowable'],
                        [/\bfriend\b/gi, 'fwiend'],
                        [/\bfriends\b/gi, 'fwiends'],
                        [/\bthanks\b/gi, 'fank'],
                        [/\bthank you\b/gi, 'fank u'],
                        [/\bdog\b/gi, 'doggo'],
                        [/\bdogs\b/gi, 'doggos'],
                        [/\bpuppy\b/gi, 'pupper'],
                        [/\bpup\b/gi, 'pupper'],
                        [/\bfood\b/gi, 'snacc'],
                        [/\beat\b/gi, 'nom'],
                        [/\beating\b/gi, 'nomming'],
                        [/\bvery\b/gi, 'vewy'],
                        [/\breally\b/gi, 'weawwy'],
                        [/\byes\b/gi, 'yus'],
                        [/\byeah\b/gi, 'yeh'],
                        [/\bno\b/gi, 'naw'],
                        [/\bokay\b/gi, 'oki doki'],
                        [/\bok\b/gi, 'oki'],
                        [/\bhello\b/gi, 'hewwo'],
                        [/\bhi\b/gi, 'hai'],
                        [/\bgoodbye\b/gi, 'bai'],
                        [/\bbye\b/gi, 'bai'],
                        [/\blove\b/gi, 'wuv'],
                        [/\blike\b/gi, 'wike'],
                        [/\bwhat\b/gi, 'wut'],
                        [/\bwhy\b/gi, 'wai'],
                        [/\bwhen\b/gi, 'wen'],
                        [/\bwhere\b/gi, 'whewe'],
                        [/\bwho\b/gi, 'hoo'],
                        [/\bhave\b/gi, 'hav'],
                        [/\bhas\b/gi, 'haz'],
                        [/\bmy\b/gi, 'mah'],
                        [/\byour\b/gi, 'yur'],
                        [/\bthe\b/gi, 'da'],
                        [/\band\b/gi, 'an'],
                        [/\bbecause\b/gi, 'cuz'],
                        [/\babout\b/gi, 'bout'],
                        [/\bknow\b/gi, 'no'],
                        [/\bnow\b/gi, 'nao'],
                        [/\bhere\b/gi, 'heer'],
                        [/\bthere\b/gi, 'dere'],
                        [/\bthis\b/gi, 'dis'],
                        [/\bthat\b/gi, 'dat'],
                        [/\bwith\b/gi, 'wif'],
                        [/\bwithout\b/gi, 'wifout'],
                        [/\btime\b/gi, 'tim'],
                        [/\bpeople\b/gi, 'ppl'],
                        [/\bperson\b/gi, 'pewson'],
                        [/\bsomething\b/gi, 'sumfing'],
                        [/\banything\b/gi, 'anyfing'],
                        [/\beverything\b/gi, 'evwyfing'],
                        [/\bnothing\b/gi, 'nuffing'],
                        [/\bgoing\b/gi, 'goin'],
                        [/\bcoming\b/gi, 'comin'],
                        [/\bthinking\b/gi, 'finking'],
                        [/\bmake\b/gi, 'mkek'],
                        [/\bhelp\b/gi, 'hewp'],
                        [/\bstop\b/gi, 'stawp'],
                        [/\bjust\b/gi, 'jus'],
                        [/\bmore\b/gi, 'moar'],
                        [/\bless\b/gi, 'wess'],
                        [/\bbetter\b/gi, 'bettew'],
                        [/\bworse\b/gi, 'wowse'],
                        [/\bbest\b/gi, 'bestest'],
                        [/\bworst\b/gi, 'wowst'],
                        [/\bcan\b/gi, 'can'],
                        [/\bcant\b/gi, 'cant'],
                        [/\bwont\b/gi, 'wont'],
                        [/\bdont\b/gi, 'dont'],
                        [/\bdoesnt\b/gi, 'doesnt'],
                        [/\bisnt\b/gi, 'isnt'],
                        [/\barent\b/gi, 'awent'],
                        [/\bwasnt\b/gi, 'wasnt'],
                        [/\bwerent\b/gi, 'wewent'],
                        [/\bhavent\b/gi, 'havent'],
                        [/\bhasnt\b/gi, 'hasnt'],
                        [/\bcouldnt\b/gi, 'couldnt'],
                        [/\bwouldnt\b/gi, 'wouldnt'],
                        [/\bshouldnt\b/gi, 'shouldnt'],
                        [/\bmustnt\b/gi, 'mustnt'],
                        [/\bmightnt\b/gi, 'mightnt'],
                        [/\bneednt\b/gi, 'neednt'],
                        [/\bdarent\b/gi, 'dawent'],
                        [/\bused\b/gi, 'used'],
                        [/\buse\b/gi, 'use'],
                        [/\busing\b/gi, 'usin'],
                        [/\bused\b/gi, 'used'],
                        [/\buse\b/gi, 'use'],
                        [/\busing\b/gi, 'usin'],
                    ];

                    for (const [re, rep] of vocab) {
                        catMessage = catMessage.replace(re, rep);
                    }

                    // Enhanced uwu phonetics - more aggressive transformations
                    catMessage = catMessage
                        .replace(/r|l/g, 'w')
                        .replace(/R|L/g, 'W')
                        .replace(/\bth/gi, (m) => (m[0] === 'T' ? 'D' : 'd'))
                        .replace(/ove/gi, (m) => (m[0] === 'O' ? 'Uv' : 'uv'))
                        .replace(/ou/gi, 'ow')
                        .replace(/OU/gi, 'OW')
                        .replace(/ing\b/gi, 'in')
                        .replace(/ING\b/gi, 'IN')
                        .replace(/tion/gi, 'shun')
                        .replace(/TION/gi, 'SHUN')
                        .replace(/sion/gi, 'zhun')
                        .replace(/SION/gi, 'ZHUN')
                        .replace(/ture/gi, 'chur')
                        .replace(/TURE/gi, 'CHUR');

                    // More aggressive hyphenation - up to 3 words per message
                    let hyphenatedCount = 0;
                    catMessage = catMessage.replace(/\b[A-Za-z]{3,10}\b/g, (word) => {
                        if (hyphenatedCount >= 3) return word;
                        // More words get hyphenated now
                        const shouldHyphenate = (word.length % 2 === 0) || (word.length % 3 === 0);
                        if (!shouldHyphenate) return word;
                        hyphenatedCount += 1;
                        return word.split('').join('-');
                    });

                    // Add more UwU expressions and cat sounds
                    const uwuExpressions = ['UwU', 'OwO', '>.<', '^w^', '(*^▽^*)', '(´｡• ᵕ •｡`)', '(◕‿◕)', '(｡♥‿♥｡)'];
                    const catSounds = ['*purrs*', '*meow*', '*nya*', '*mew*', '*prrr*', '*hisses softly*', '*stretches*', '*kneads paws*'];
                    
                    const randomExpression = uwuExpressions[Math.floor(Math.random() * uwuExpressions.length)];
                    const randomCatSound = catSounds[Math.floor(Math.random() * catSounds.length)];
                    
                    // Ensure sentences end with UwU, cat tag, and random expressions
                    catMessage = catMessage.replace(/[.!?]+/g, (punc) => `${punc} ${tagWord}~ ${randomExpression} ${randomCatSound}`);
                    if (!/[.!?]\s*$/.test(catMessage)) {
                        catMessage = `${catMessage} ${tagWord}~ ${randomExpression} ${randomCatSound}`;
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
