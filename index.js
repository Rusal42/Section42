// index.js

// Load environment variables
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers  // Required for member update events
    ] 
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Command handler setup
const fs = require('fs');
const path = require('path');

const commands = new Map();

// Load commands from multiple directories
const commandDirectories = ['commands', 'ServerCreation', 'ownercommands', 'moderationcommands'];

commandDirectories.forEach(dirName => {
    const dirPath = path.join(__dirname, dirName);
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require(path.join(dirPath, file));
                commands.set(command.name, command);
            }
        });
    }
});

// Load event handlers
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
        
        console.log(`📡 Loaded event: ${event.name}`);
    }
}

// Listen for messages
client.on('messageCreate', message => {
    if (!message.content.startsWith('!') || message.author.bot) return;
    const args = message.content.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);
    if (command) {
        command.execute(message, args);
    }
});

// Simple HTTP server to keep Render happy
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Section42 Discord Bot is running!');
});

server.listen(port, () => {
    console.log(`🌐 HTTP server running on port ${port}`);
});

// Log in to Discord with your bot token
client.login(process.env.DISCORD_TOKEN);
