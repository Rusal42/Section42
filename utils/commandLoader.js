const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { DEV_MODE } = require('../config/constants');

function loadCommands(client) {
    const commands = new Map();
    const slashCommands = new Collection();
    const slashCommandsData = [];

    const commandDirectories = ['commands', 'commands/fun-commands', 'ServerCreation', 'ownercommands', 'moderationcommands'];
    if (DEV_MODE) commandDirectories.push('Test commands', 'clothingcommands');

    commandDirectories.forEach(dirName => {
        const dirPath = path.join(__dirname, '..', dirName);
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

    return { commands, slashCommands, slashCommandsData };
}

function loadEvents(client) {
    const eventsPath = path.join(__dirname, '..', 'events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            const events = Array.isArray(event) ? event : [event];
            
            for (const ev of events) {
                if (!ev || !ev.name || typeof ev.execute !== 'function') {
                    console.warn(`[Loader] Skipping invalid event export from ${file}`);
                    continue;
                }
                
                if (ev.once) {
                    client.once(ev.name, (...args) => ev.execute.call(ev, ...args));
                } else {
                    client.on(ev.name, (...args) => ev.execute.call(ev, ...args));
                }
                
                console.log(`Loaded event: ${ev.name}${ev.once ? ' (once)' : ''}`);
            }
        }
    }
}

module.exports = {
    loadCommands,
    loadEvents
};
