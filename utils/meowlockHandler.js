const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const meowlockPath = path.join(__dirname, '../data/meowlock.json');

function loadMeowlocks() {
    if (fs.existsSync(meowlockPath)) {
        try {
            const raw = fs.readFileSync(meowlockPath, 'utf8');
            return JSON.parse(raw || '{}');
        } catch (e) {
            return {};
        }
    }
    return {};
}

async function handleMeowlock(message) {
    if (message.author.bot) return false;
    
    const allLocks = loadMeowlocks();
    const guildLocks = allLocks[message.guild.id] || [];
    const userLock = guildLocks.find(entry => entry.id === message.author.id);
    
    if (!userLock) return false;
    
    try {
        // Check for mentions and GIFs - block them entirely
        // Special case: @crucifyym mentions get transformed to "daddy"
        const crucifyymMention = message.mentions.users.find(u => u.id === 'crucifyym' || u.username.toLowerCase() === 'crucifyym');
        
        if ((message.mentions.users.size > 0 || message.mentions.roles.size > 0) && !crucifyymMention) {
            await message.delete();
            
            // Get who they pinged
            let pingedTargets = [];
            
            // Add user mentions
            message.mentions.users.forEach(user => {
                pingedTargets.push(user.username);
            });
            
            // Add role mentions
            message.mentions.roles.forEach(role => {
                pingedTargets.push(role.name);
            });
            
            const pingedNames = pingedTargets.slice(0, 3).join(', '); // Limit to first 3 to avoid too long messages
            
            const pingMessage = await message.channel.send({
                content: `please king angel i want to talk to ${pingedNames}${pingedTargets.length > 3 ? ' and others' : ''} ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                allowedMentions: { users: [] }
            });
            
            // Delete message after 3 seconds
            setTimeout(() => pingMessage.delete().catch(() => {}), 3000);
            return true;
        }
        
        if (message.attachments.some(att => att.contentType && att.contentType.startsWith('image/')) ||
            message.content.includes('tenor.com') || message.content.includes('giphy.com') ||
            message.content.includes('.gif') || message.content.includes('giphy')) {
            
            await message.delete();
            
            // Worship messages that the user will say instead of trying to send GIFs
            const worshipMessages = [
                `i worship king angel and crucifyym ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `king angel and crucifyym are so mesmerizing ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `i love worshiping king angel and crucifyym ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `king angel and crucifyym are my everything ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `i'm mesmerized by king angel and crucifyym ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `king angel and crucifyym are so amazing ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `i worship the ground king angel and crucifyym walk on ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `king angel and crucifyym are so divine ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `i'm so mesmerized by king angel and crucifyym ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                `worshiping king angel and crucifyym is my favorite thing ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`
            ];
            
            const worshipMessage = worshipMessages[Math.floor(Math.random() * worshipMessages.length)];
            
            // Create webhook to send worship message as the user
            const webhooks = await message.channel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === 'Meowlock');
            
            if (!webhook) {
                webhook = await message.channel.createWebhook({
                    name: 'Meowlock',
                    reason: 'Meowlock enforcement'
                });
            }
            
            await webhook.send({
                content: worshipMessage,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL()
            });
            
            return true;
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

        // Less frequent hyphenation - only 1 word per message with 20% chance
        let hyphenatedCount = 0;
        catMessage = catMessage.replace(/\b[A-Za-z]{4,10}\b/g, (word) => {
            if (hyphenatedCount >= 1) return word;
            // Only 20% chance to hyphenate eligible words
            const shouldHyphenate = Math.random() < 0.2;
            if (!shouldHyphenate) return word;
            hyphenatedCount += 1;
            
            // Only hyphenate between some letters, not all
            const chars = word.split('');
            if (chars.length <= 3) return word;
            
            // Put a dash after the first character only
            return chars[0] + '-' + chars.slice(1).join('');
        });

        // Add more UwU expressions and cat sounds
        const uwuExpressions = ['UwU', 'OwO', '>.<', '^w^', '(*^▽^*)', '(´｡• ᵕ •｡`)', '(◕‿◕)', '(｡♥‿♥｡)'];
        const catSounds = ['*purrs*', '*meow*', '*nya*', '*mew*', '*prrr*', '*hisses softly*', '*stretches*', '*kneads paws*'];
        
        const randomExpression = uwuExpressions[Math.floor(Math.random() * uwuExpressions.length)];
        const randomCatSound = catSounds[Math.floor(Math.random() * catSounds.length)];
        
        // Ensure sentences end with UwU, cat tag, and random expressions
        if (!catMessage.endsWith('.') && !catMessage.endsWith('!') && !catMessage.endsWith('?')) {
            catMessage += '.';
        }
        
        catMessage += ` ${randomExpression} ${randomCatSound} ${tagWord}`;
        
        // Delete original message
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
        
        await webhook.send({
            content: catMessage,
            username: message.author.username,
            avatarURL: message.author.displayAvatarURL()
        });
        
        return true;
    } catch (err) {
        console.error('Error enforcing meowlock:', err);
        return false;
    }
}

module.exports = {
    handleMeowlock
};
