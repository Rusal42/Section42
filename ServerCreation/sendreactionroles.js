const { EmbedBuilder } = require('discord.js');
const { OWNER_IDS } = require('../config/constants');
const messageTracker = require('../utils/messageTracker');

module.exports = {
    name: 'sendreactionroles',
    description: 'Sends reaction role embeds for gender and color roles',
    
    async execute(message) {
        if (!OWNER_IDS.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('Only the bot owner can use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        // Find the 👤 channel in the Roles category
        const rolesChannel = message.guild.channels.cache.find(channel => channel.name === '👤');
        
        if (!rolesChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Channel Not Found')
                .setDescription('Could not find the `👤` channel. Please make sure it exists in the Roles category.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        await message.delete().catch(() => {});

        // Gender Roles Embed
        const genderEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('Gender Roles')
            .setDescription('React to get your gender role!\n\n♂️ - Male\n♀️ - Female')
            .setFooter({ text: 'React to add/remove roles' })
            .setTimestamp();

        const genderMessage = await rolesChannel.send({ embeds: [genderEmbed] });
        await genderMessage.react('♂️');
        await genderMessage.react('♀️');

        // Save gender message ID
        messageTracker.saveMessage(message.guild.id, 'reaction_roles_gender', rolesChannel.id, genderMessage.id);

        // Color Roles Embed
        const colorEmbed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('🎨 Color Roles')
            .setDescription('React to get your color role!\n\n🔴 - Red\n🟠 - Orange\n🟡 - Yellow\n🟢 - Green\n🔵 - Blue\n🟣 - Purple\n🩷 - Pink\n⚪ - White\n⚫ - Black')
            .setFooter({ text: 'React to add/remove roles • You can only have one color at a time' })
            .setTimestamp();

        const colorMessage = await rolesChannel.send({ embeds: [colorEmbed] });
        await colorMessage.react('🔴');
        await colorMessage.react('🟠');
        await colorMessage.react('🟡');
        await colorMessage.react('🟢');
        await colorMessage.react('🔵');
        await colorMessage.react('🟣');
        await colorMessage.react('🩷');
        await colorMessage.react('⚪');
        await colorMessage.react('⚫');

        // Save color message ID
        messageTracker.saveMessage(message.guild.id, 'reaction_roles_color', rolesChannel.id, colorMessage.id);

        const successEmbed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Reaction Roles Sent!')
            .setDescription('Gender and color role messages have been posted with reactions and tracked.')
            .setTimestamp();

        try {
            await message.author.send({ embeds: [successEmbed] });
        } catch {
            const tempMsg = await message.channel.send({ embeds: [successEmbed] });
            setTimeout(() => tempMsg.delete().catch(() => {}), 5000);
        }
    }
};
