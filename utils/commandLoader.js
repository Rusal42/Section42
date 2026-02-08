const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
    const commands = new Map();
    const slashCommands = new Collection();
    const slashCommandsData = [];

    const commandDirectories = ['commands', 'commands/fun-commands', 'ServerCreation', 'ownercommands', 'moderationcommands'];

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
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            
            console.log(`Loaded event: ${event.name}`);
        }
    }
}

module.exports = {
    loadCommands,
    loadEvents
};
