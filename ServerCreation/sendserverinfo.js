const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'sendserverinfo',
    description: 'Sends comprehensive server information including graphic design services',
    
    async execute(message) {
        const OWNER_ID = '746068840978448565';
        
        if (message.author.id !== OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        const serverInfoChannel = message.guild.channels.cache.find(channel => channel.name === 'server-info');
        
        if (!serverInfoChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Channel Not Found')
                .setDescription('Could not find the `server-info` channel. Please make sure it exists.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        await message.delete().catch(() => {});

        const serverInfoEmbed = new EmbedBuilder()
            .setColor('#1e3a8a')
            .setTitle('Welcome to Crucifyym\'s Community!')
            .setDescription('Your ultimate community for content creators, gamers, and music lovers!')
            .addFields(
                {
                    name: '**About This Community**',
                    value: 'Welcome to Crucifyym\'s community! This is where content creators, gamers, and music lovers come together. We support Section42 Roblox group and create amazing content across multiple platforms.',
                    inline: false
                },
                {
                    name: '**Content Creators**',
                    value: 'Share your videos, streams, and content in our creator channels. Get promoted and collaborate with others!',
                    inline: false
                },
                {
                    name: '**Important Links**',
                    value: '• **Roblox Group**: [Join Section42](https://www.roblox.com/groups/)\n• **Follow**: [crucifyym](https://www.roblox.com/users/489110745/profile)\n• **YouTube**: [crucifyym](https://youtube.com/@crucifyym)\n• **Twitch**: [crucifyym](https://twitch.tv/crucifyym)\n• **TikTok**: [crucifyym](https://tiktok.com/@crucifyym)\n• **SoundCloud**: [rusal-42](https://soundcloud.com/rusal-42)\n• **BandLab**: [crucifyym](https://bandlab.com/crucifyym)\n• **Discord**: You\'re here!',
                    inline: false
                },
                {
                    name: '**How to Get Started**',
                    value: '1. Read the rules in <#rules>\n2. Introduce yourself in <#welcome>\n3. Explore our channels and join the community!\n4. Share your content and engage with others',
                    inline: false
                }
            )
            .setThumbnail(message.guild.iconURL())
            .setTimestamp()
            .setFooter({ text: 'Welcome to Crucifyym\'s Community!', iconURL: message.guild.iconURL() });

        const designServicesEmbed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('Graphic Design Services by Crucifyym')
            .setDescription('**Professional digital art and design services available!**')
            .addFields(
                {
                    name: '**Business Services**',
                    value: '• **Logo Design** - Professional logos for small businesses\n• **Brand Identity** - Complete branding packages\n• **Marketing Materials** - Flyers, banners, social media graphics',
                    inline: false
                },
                {
                    name: '**Discord & Gaming**',
                    value: '• **Custom Profile Pictures** - Unique avatars and PFPs\n• **Discord Banners** - Eye-catching server and user banners\n• **Gaming Graphics** - Overlays, thumbnails, and stream graphics',
                    inline: false
                },
                {
                    name: '**Digital Art**',
                    value: '• **Character Art** - Original character designs\n• **Illustrations** - Custom digital artwork\n• **Concept Art** - Game and project concepts\n• **Any Digital Art** - If you can imagine it, I can create it!',
                    inline: false
                },
                {
                    name: '**Pricing Structure**',
                    value: '**Hourly Rate:** Charged by time and complexity\n**Factors affecting price:**\n• Project complexity and detail level\n• Time required for completion\n• Revisions and iterations needed\n• Rush orders (if applicable)',
                    inline: false
                },
                {
                    name: '**How to Order**',
                    value: '1. **Contact:** DM crucifyym\n2. **Discuss:** Describe your project and vision\n3. **Quote:** Receive a custom quote based on your needs\n4. **Create:** Watch your vision come to life!\n\n*Free consultations available!*',
                    inline: false
                },
                {
                    name: '**Why Choose Crucifyym?**',
                    value: '• **Experience:** Proven track record in digital design\n• **Quality:** High-resolution, professional results\n• **Communication:** Regular updates throughout the process\n• **Satisfaction:** Revisions included until you\'re happy!',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Ready to bring your vision to life? Contact crucifyym today!', iconURL: message.guild.iconURL() });

        await serverInfoChannel.send({ embeds: [serverInfoEmbed] });
        await serverInfoChannel.send({ embeds: [designServicesEmbed] });

        const successEmbed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('Server Info Sent!')
            .setDescription('All server information embeds have been posted successfully, including your graphic design services!')
            .setTimestamp();

        try {
            await message.author.send({ embeds: [successEmbed] });
        } catch {
            await message.channel.send({ embeds: [successEmbed] });
        }
    }
};
