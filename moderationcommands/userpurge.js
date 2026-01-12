const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'userpurge',
    description: 'Delete messages from a specific user',
    data: new SlashCommandBuilder()
        .setName('userpurge')
        .setDescription('Delete messages from a specific user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose messages to delete')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to check (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to use this command.')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        let targetUser = message.mentions.users.first();
        
        if (!targetUser && args[0]) {
            const userId = args[0].replace(/[<@!>]/g, '');
            try {
                targetUser = await message.client.users.fetch(userId);
            } catch (error) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Invalid User')
                    .setDescription('Could not find that user.')
                    .setTimestamp();
                return message.channel.send({ embeds: [errorEmbed] });
            }
        }

        const amount = parseInt(args[1]);
        
        if (!targetUser || !amount || isNaN(amount) || amount < 1 || amount > 100) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Invalid Usage')
                .setDescription('**Usage:** `!userpurge @user <amount>` or `!userpurge <userID> <amount>`\n\n**Examples:**\n`!userpurge @spammer 50`\n`!userpurge 123456789012345678 25`')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        try {
            await message.delete().catch(() => {});
            
            const fetchedMessages = await message.channel.messages.fetch({ limit: amount });
            const userMessages = fetchedMessages.filter(msg => msg.author.id === targetUser.id);
            
            if (userMessages.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('No Messages Found')
                    .setDescription(`No messages from ${targetUser.tag} found in the last ${amount} messages.`)
                    .setTimestamp();
                return message.channel.send({ embeds: [errorEmbed] });
            }

            await message.channel.bulkDelete(userMessages, true);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('User Messages Purged')
                .setDescription(`Successfully deleted **${userMessages.size}** messages from ${targetUser.tag}.`)
                .setFooter({ text: `Purged by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            const confirmMsg = await message.channel.send({ embeds: [successEmbed] });
            setTimeout(() => {
                confirmMsg.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error purging user messages:', error);
            
            let errorMessage = 'An error occurred while trying to delete messages.';
            if (error.code === 50034) {
                errorMessage = 'Cannot delete messages older than 14 days.';
            } else if (error.code === 50013) {
                errorMessage = 'I don\'t have permission to delete messages in this channel.';
            }
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Purge Failed')
                .setDescription(errorMessage)
                .setTimestamp();
            
            message.channel.send({ embeds: [errorEmbed] });
        }
    },

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Access Denied')
                .setDescription('You need the **Manage Messages** permission to use this command.')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        try {
            await interaction.deferReply({ ephemeral: true });
            
            const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });
            const userMessages = fetchedMessages.filter(msg => msg.author.id === targetUser.id);
            
            if (userMessages.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('No Messages Found')
                    .setDescription(`No messages from ${targetUser.tag} found in the last ${amount} messages.`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            await interaction.channel.bulkDelete(userMessages, true);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('User Messages Purged')
                .setDescription(`Successfully deleted **${userMessages.size}** messages from ${targetUser.tag}.`)
                .setFooter({ text: `Purged by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Error purging user messages:', error);
            
            let errorMessage = 'An error occurred while trying to delete messages.';
            if (error.code === 50034) {
                errorMessage = 'Cannot delete messages older than 14 days.';
            } else if (error.code === 50013) {
                errorMessage = 'I don\'t have permission to delete messages in this channel.';
            }
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Purge Failed')
                .setDescription(errorMessage)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
