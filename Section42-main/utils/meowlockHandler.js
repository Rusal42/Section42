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
            
            // Create webhook to send ping message as the user
            const webhooks = await message.channel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === 'Meowlock');
            
            if (!webhook) {
                webhook = await message.channel.createWebhook({
                    name: 'Meowlock',
                    reason: 'Meowlock enforcement'
                });
            }
            
            await webhook.send({
                content: `please king angel i want to talk to ${pingedNames}${pingedTargets.length > 3 ? ' and others' : ''} ${userLock.style === 'nya' ? 'nya~' : 'meow~'}`,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL()
            });
            
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
        
        // Font detection and normalization - prevent bypassing with fancy fonts
        const hasFancyFonts = /[^\x00-\x7F]/.test(catMessage); // Check for non-ASCII characters
        
        if (hasFancyFonts) {
            // Normalize fancy fonts to regular text
            const fontMap = {
                // Mathematical bold/italic/script etc.
                '𝒶': 'a', '𝒷': 'b', '𝒸': 'c', '𝒹': 'd', '𝑒': 'e', '𝒻': 'f', '𝑔': 'g', '𝒽': 'h', '𝒾': 'i', '𝒿': 'j', '𝓀': 'k', '𝓁': 'l', '𝓂': 'm', '𝓃': 'n', '𝓄': 'o', '𝓅': 'p', '𝓆': 'q', '𝓇': 'r', '𝓈': 's', '𝓉': 't', '𝓊': 'u', '𝓋': 'v', '𝓌': 'w', '𝓍': 'x', '𝓎': 'y', '𝓏': 'z',
                '𝔸': 'A', '𝔹': 'B', 'ℂ': 'C', '𝔻': 'D', '𝔼': 'E', '𝔽': 'F', '𝔾': 'G', 'ℍ': 'H', '𝕀': 'I', '𝕁': 'J', '𝕂': 'K', '𝕃': 'L', '𝕄': 'M', '𝕅': 'N', '𝕆': 'O', 'ℙ': 'P', '𝕊': 'Q', '𝕈': 'R', '𝕊': 'S', '𝕋': 'T', '𝕌': 'U', '𝕍': 'V', '𝕎': 'W', '𝕏': 'X', '𝕐': 'Y', '𝕑': 'Z',
                
                // Bold script
                '𝓪': 'a', '𝓫': 'b', '𝓬': 'c', '𝓭': 'd', '𝓮': 'e', '𝓯': 'f', '𝓰': 'g', '𝓱': 'h', '𝓲': 'i', '𝓳': 'j', '𝓴': 'k', '𝓵': 'l', '𝓶': 'm', '𝓷': 'n', '𝓸': 'o', '𝓹': 'p', '𝓺': 'q', '𝓻': 'r', '𝓼': 's', '𝓽': 't', '𝓾': 'u', '𝓿': 'v', '𝔀': 'w', '𝔁': 'x', '𝔂': 'y', '𝔃': 'z',
                '𝓐': 'A', '𝓑': 'B', '𝓒': 'C', '𝓓': 'D', '𝓔': 'E', '𝓕': 'F', '𝓖': 'G', '𝓗': 'H', '𝓘': 'I', '𝓙': 'J', '𝓚': 'K', '𝓛': 'L', '𝓜': 'M', '𝓝': 'N', '𝓞': 'O', '𝓟': 'P', '𝓠': 'Q', '𝓡': 'R', '𝓢': 'S', '𝓣': 'T', '𝓤': 'U', '𝓥': 'V', '𝓦': 'W', '𝓧': 'X', '𝓨': 'Y', '𝓩': 'Z',
                
                // Monospace
                '𝚊': 'a', '𝚋': 'b', '𝚌': 'c', '𝚍': 'd', '𝚎': 'e', '𝚏': 'f', '𝚐': 'g', '𝚑': 'h', '𝚒': 'i', '𝚓': 'j', '𝚔': 'k', '𝚕': 'l', '𝚖': 'm', '𝚗': 'n', '𝚘': 'o', '𝚙': 'p', '𝚚': 'q', '𝚛': 'r', '𝚜': 's', '𝚝': 't', '𝚞': 'u', '𝚟': 'v', '𝚠': 'w', '𝚡': 'x', '𝚢': 'y', '𝚣': 'z',
                '𝙰': 'A', '𝙱': 'B', '𝙲': 'C', '𝙳': 'D', '𝙴': 'E', '𝙵': 'F', '𝙶': 'G', '𝙷': 'H', '𝙸': 'I', '𝙹': 'J', '𝙺': 'K', '𝙻': 'L', '𝙼': 'M', '𝙽': 'N', '𝙾': 'O', '𝙿': 'P', '𝚀': 'Q', '𝚁': 'R', '𝚂': 'S', '𝚃': 'T', '𝚄': 'U', '𝚅': 'V', '𝚆': 'W', '𝚇': 'X', '𝚈': 'Y', '𝚉': 'Z',
                
                // Double-struck
                '𝕒': 'a', '𝕓': 'b', '𝕔': 'c', '𝕕': 'd', '𝕖': 'e', '𝕗': 'f', '𝕘': 'g', '𝕙': 'h', '𝕚': 'i', '𝕛': 'j', '𝕜': 'k', '𝕝': 'l', '𝕞': 'm', '𝕟': 'n', '𝕠': 'o', '𝕡': 'p', '𝕢': 'q', '𝕣': 'r', '𝕤': 's', '𝕥': 't', '𝕦': 'u', '𝕧': 'v', '𝕨': 'w', '𝕩': 'x', '𝕪': 'y', '𝕫': 'z',
                '𝔸': 'A', '𝔹': 'B', 'ℂ': 'C', '𝔻': 'D', '𝔼': 'E', '𝔽': 'F', '𝔾': 'G', 'ℍ': 'H', '𝕀': 'I', '𝕁': 'J', '𝕂': 'K', '𝕃': 'L', '𝕄': 'M', '𝕅': 'N', '𝕆': 'O', 'ℙ': 'P', '�': 'Q', '�': 'R', '𝕊': 'S', '𝕋': 'T', '𝕌': 'U', '𝕍': 'V', '𝕎': 'W', '𝕏': 'X', '𝕐': 'Y', '𝕑': 'Z',
                
                // Sans-serif
                '𝖆': 'a', '𝖇': 'b', '𝖈': 'c', '𝖉': 'd', '𝖊': 'e', '𝖋': 'f', '𝌆': 'g', '𝖍': 'h', '𝖎': 'i', '𝖏': 'j', '𝖐': 'k', '𝖑': 'l', '𝖒': 'm', '𝖓': 'n', '𝖔': 'o', '𝖕': 'p', '𝖖': 'q', '𝖗': 'r', '𝖘': 's', '𝖙': 't', '𝖚': 'u', '𝖛': 'v', '𝖜': 'w', '𝖝': 'x', '𝖞': 'y', '𝖟': 'z',
                '𝕬': 'A', '𝕭': 'B', '𝕮': 'C', '𝕯': 'D', '𝕰': 'E', '𝕱': 'F', '𝕲': 'G', '𝕳': 'H', '𝕴': 'I', '𝕵': 'J', '𝕶': 'K', '𝕷': 'L', '𝕸': 'M', '𝕹': 'N', '𝕺': 'O', '𝕻': 'P', '𝕼': 'Q', '𝕽': 'R', '𝕾': 'S', '𝕿': 'T', '𝖀': 'U', '𝖁': 'V', '𝖂': 'W', '𝖃': 'X', '𝖄': 'Y', '𝖅': 'Z',
                
                // Common fancy characters that might be used to bypass
                'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y', 'ｚ': 'z',
                'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E', 'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I', 'Ｊ': 'J', 'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O', 'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T', 'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y', 'Ｚ': 'Z',
                
                // Circled letters and numbers
                'ⓐ': 'a', 'ⓑ': 'b', 'ⓒ': 'c', 'ⓓ': 'd', 'ⓔ': 'e', 'ⓕ': 'f', 'ⓖ': 'g', 'ⓗ': 'h', 'ⓘ': 'i', 'ⓙ': 'j', 'ⓚ': 'k', 'ⓛ': 'l', 'ⓜ': 'm', 'ⓝ': 'n', 'ⓞ': 'o', 'ⓟ': 'p', 'ⓠ': 'q', 'ⓡ': 'r', 'ⓢ': 's', 'ⓣ': 't', 'ⓤ': 'u', 'ⓥ': 'v', 'ⓦ': 'w', 'ⓧ': 'x', 'ⓨ': 'y', 'ⓩ': 'z',
                'Ⓐ': 'A', 'Ⓑ': 'B', 'Ⓒ': 'C', 'Ⓓ': 'D', 'Ⓔ': 'E', 'Ⓕ': 'F', 'Ⓖ': 'G', 'Ⓗ': 'H', 'Ⓘ': 'I', 'Ⓙ': 'J', 'Ⓚ': 'K', 'Ⓛ': 'L', 'Ⓜ': 'M', 'Ⓝ': 'N', 'Ⓞ': 'O', 'Ⓟ': 'P', 'Ⓠ': 'Q', 'Ⓡ': 'R', 'Ⓢ': 'S', 'Ⓣ': 'T', 'Ⓤ': 'U', 'Ⓥ': 'V', 'Ⓦ': 'W', 'Ⓧ': 'X', 'Ⓨ': 'Y', 'Ⓩ': 'Z',
                '⓪': '0', '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10', '⑪': '11', '⑫': '12', '⑬': '13', '⑭': '14', '⑮': '15', '⑯': '16', '⑰': '17', '⑱': '18', '⑲': '19', '⑳': '20',
                
                // Numbers and symbols
                '０': '0', '１': '1', '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
                '！': '!', '？': '?', '．': '.', '，': ',', '：': ':', '；': ';', '（': '(', '）': ')', '［': '[', '］': ']', '｛': '{', '｝': '}',
                
                // Common Unicode bypass attempts
                'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
                'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
                'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u',
                'û': 'u', 'ü': 'u', 'ÿ': 'y', 'ß': 'ss',
                
                // Greek letters sometimes used for bypass
                'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'u', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'w',
                'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'U', 'Φ': 'F', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'W'
            };
            
            // Replace all fancy characters with normal ones
            for (const [fancy, normal] of Object.entries(fontMap)) {
                catMessage = catMessage.replace(new RegExp(fancy, 'g'), normal);
            }
            
            // Remove any remaining non-ASCII characters that aren't common punctuation
            catMessage = catMessage.replace(/[^\x00-\x7F\s.,!?;:()[\]{}'"@#$%^&*+=<>/\\|`~-]/g, '');
            
            // Check if message is empty or just symbols after normalization
            if (!catMessage.trim() || /^[\s.,!?;:()[\]{}'"@#$%^&*+=<>/\\|`~-]*$/.test(catMessage.trim())) {
                catMessage = "im sorry for being so naughty dada";
            }
        }
        
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
            [/\bass\b/gi, 'butt'],
            [/\bbitch\b/gi, 'meanie'],
            [/\bcunt\b/gi, 'meanie'],
            [/\bdick\b/gi, 'peepee'],
            [/\bpussy\b/gi, 'peepee'],
            [/\bcock\b/gi, 'peepee'],
            [/\bhell\b/gi, 'heck'],
            [/\bdamn\b/gi, 'darn'],
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
            // KYS and harmful phrases - meowified versions
            [/\bkys\b/gi, 'meow kys'],
            [/\bkill your self\b/gi, 'meow kill your self'],
            [/\bkillyourself\b/gi, 'nya kill your self'],
            [/\bkill yourself\b/gi, 'meow kill your self'],
            [/\bkms\b/gi, 'purr kys'],
            [/\bkill my self\b/gi, 'meow kill my self'],
            [/\bend your life\b/gi, 'nya end your life'],
            [/\bend it all\b/gi, 'meow end it all'],
            [/\bgive up\b/gi, 'purr give up'],
            [/\brope\b/gi, 'meow rope'],
            [/\bneck\b/gi, 'nya neck'],
            [/\bharm\b/gi, 'meow harm'],
            [/\bhurt\b/gi, 'purr hurt'],
            [/\bsuicide\b/gi, 'meow suicide'],
            [/\bdie alone\b/gi, 'nya die alone'],
            [/\bgo die\b/gi, 'meow go die'],
            [/\brope in hell\b/gi, 'meow rope in heck'],
            [/\burn in hell\b/gi, 'meow burn in heck']
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
            // Random additions for crucifyym, mesmerizing, king angel
            [/\bowner\b/gi, () => Math.random() < 0.3 ? 'crucifyym' : 'king angel'],
            [/\bboss\b/gi, () => Math.random() < 0.3 ? 'mesmerizing' : 'king angel'],
            [/\badmin\b/gi, () => Math.random() < 0.3 ? 'crucifyym' : 'king angel'],
            [/\bmoderator\b/gi, () => Math.random() < 0.3 ? 'mesmerizing' : 'king angel'],
            [/\bgod\b/gi, 'king angel'],
            [/\blord\b/gi, 'crucifyym'],
            [/\bmaster\b/gi, 'mesmerizing']
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
        
        // Make single word messages weird
        const words = catMessage.trim().split(/\s+/);
        if (words.length === 1) {
            const weirdWords = [
                words[0] + '...?',
                words[0] + '!!!',
                words[0] + ' >.<',
                words[0] + ' ^w^',
                words[0] + ' UwU',
                words[0] + ' *meow*',
                words[0] + ' nya~',
                words[0] + ' mew...',
                words[0] + ' >w<',
                words[0] + ' *purrs*'
            ];
            catMessage = weirdWords[Math.floor(Math.random() * weirdWords.length)];
        }
        
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
