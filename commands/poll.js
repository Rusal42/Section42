const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Create a poll with reactions',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('You need the "Manage Messages" permission to use this command.');
        }

        await message.delete().catch(() => {});

        if (args.length === 0) {
            return message.channel.send('Usage: `!poll <question> | <option1> | <option2> | [option3] | [option4]`\n' +
                'Example: `!poll What game should we make next? | RPG | Simulator | Tycoon | Fighting`');
        }

        const input = args.join(' ');
        const parts = input.split(' | ');

        if (parts.length < 3) {
            return message.channel.send('You need at least a question and 2 options!\n' +
                'Usage: `!poll <question> | <option1> | <option2> | [option3] | [option4]`');
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 4) {
            return message.channel.send('Maximum 4 options allowed!');
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        
        let optionText = '';
        for (let i = 0; i < options.length; i++) {
            optionText += `${emojis[i]} ${options[i]}\n`;
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle('Section42 Poll')
                .setDescription(`**${question}**\n\n${optionText}`)
                .setColor('#ff6b35')
                .setTimestamp()
                .setFooter({ 
                    text: `Poll by ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            const pollMessage = await message.channel.send({ embeds: [embed] });

            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(emojis[i]);
            }
        } catch (error) {
            console.error('Error creating poll:', error);
            message.channel.send('Error creating poll.');
        }
    }
};
