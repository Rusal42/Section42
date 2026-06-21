const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'pick',
    description: 'Ping a random person in the server',
    data: new SlashCommandBuilder()
        .setName('pick')
        .setDescription('Ping a random person in the server'),
    
    async execute(message, args) {
        try {
            // Fetch all members in the server
            const members = await message.guild.members.fetch();
            
            // Filter out bots and the message author
            const validMembers = members.filter(member => 
                !member.user.bot && 
                member.id !== message.author.id &&
                !member.user.deleted
            );
            
            if (validMembers.size === 0) {
                return await message.reply('There are no other members to pick from!');
            }
            
            // Get a random member
            const randomMember = validMembers.random();
            
            // Create embed
            const embed = {
                title: 'Random Pick!',
                description: `I choose... ${randomMember.user.toString()}!`,
                color: 0xff6b35,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Picked by ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                }
            };
            
            // Send the embed, falling back to plain text if embeds are denied
            try {
                await message.channel.send({ embeds: [embed] });
            } catch (sendError) {
                if (sendError.code === 50013 || sendError.message?.includes('Missing Permissions')) {
                    await message.channel.send(
                        `**Random Pick!** I choose... ${randomMember.user.toString()}! (Picked by ${message.author.tag})`
                    );
                } else {
                    throw sendError;
                }
            }
            
            // Delete the original command message
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
            
        } catch (error) {
            console.error('Error in pick command:', error);
            await message.reply('There was an error picking a random member. Make sure I have the proper permissions!');
        }
    },
    
    async executeSlash(interaction) {
        try {
            // Fetch all members in the server
            const members = await interaction.guild.members.fetch();
            
            // Filter out bots and the interaction author
            const validMembers = members.filter(member => 
                !member.user.bot && 
                member.id !== interaction.user.id &&
                !member.user.deleted
            );
            
            if (validMembers.size === 0) {
                return await interaction.reply({
                    content: 'There are no other members to pick from!',
                    ephemeral: true
                });
            }
            
            // Get a random member
            const randomMember = validMembers.random();
            
            // Create embed
            const embed = {
                title: 'Random Pick!',
                description: `I choose... ${randomMember.user.toString()}!`,
                color: 0xff6b35,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Picked by ${interaction.user.tag}`,
                    icon_url: interaction.user.displayAvatarURL({ dynamic: true })
                }
            };
            
            // Reply with the embed
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in pick slash command:', error);
            await interaction.reply({
                content: 'There was an error picking a random member. Make sure I have the proper permissions!',
                ephemeral: true
            });
        }
    }
};
