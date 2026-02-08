const { OWNER_IDS } = require('../config/constants');

async function handleOwnerCommands(message, client) {
    // Only handle if owner mentions the bot
    if (!message.mentions.has(client.user) || !OWNER_IDS.includes(message.author.id)) {
        return false;
    }

    const content = message.content.toLowerCase().trim();

    // Check if it's a reply to the bot's "yes" message with an action command
    if (message.reference && message.reference.messageId) {
        try {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            
            // Check if the referenced message is from the bot and contains "yes"
            if (referencedMessage.author.id === client.user.id && 
                referencedMessage.content.toLowerCase().includes('yes')) {
                
                // Check for action commands
                if (content.includes('slime this guy') || 
                    content.includes('kill this guy') || 
                    content.includes('do something to this guy') ||
                    content.includes('get this guy') ||
                    content.includes('deal with this guy')) {
                    
                    await message.reply("done");
                    return true;
                }
                
                // Check for "should we" questions
                if (content.includes('should we')) {
                    const strongAgreements = [
                        "ABSOLUTELY YES DO IT",
                        "100% YES MAKE IT HAPPEN",
                        "HELL YEAH LETS GOOO",
                        "FUCK YES DO THAT SHIT",
                        "ABSOLUTELY FUCKING DO IT",
                        "YES YES YES A THOUSAND TIMES YES",
                        "NO DOUBT WHATSOEVER DO IT NOW",
                        "FUCKING ABSOLUTELY MAKE IT HAPPEN",
                        "YES THATS EXACTLY WHAT WE SHOULD DO",
                        "1000% YES LETS FUCKING DO IT"
                    ];
                    
                    const randomAgreement = strongAgreements[Math.floor(Math.random() * strongAgreements.length)];
                    await message.reply(randomAgreement);
                    return true;
                }
            }
        } catch (error) {
            // Ignore errors fetching referenced message
        }
    }

    // Check for "should we" questions
    if (content.includes('should we')) {
        const strongAgreements = [
            "ABSOLUTELY YES DO IT",
            "100% YES MAKE IT HAPPEN",
            "HELL YEAH LETS GOOO",
            "FUCK YES DO THAT SHIT",
            "ABSOLUTELY FUCKING DO IT",
            "YES YES YES A THOUSAND TIMES YES",
            "NO DOUBT WHATSOEVER DO IT NOW",
            "FUCKING ABSOLUTELY MAKE IT HAPPEN",
            "YES THATS EXACTLY WHAT WE SHOULD DO",
            "1000% YES LETS FUCKING DO IT"
        ];
        
        const randomAgreement = strongAgreements[Math.floor(Math.random() * strongAgreements.length)];
        await message.reply(randomAgreement);
        return true;
    }
    
    // Default response for regular pings
    await message.reply("yes");
    return true;
}

module.exports = {
    handleOwnerCommands
};
