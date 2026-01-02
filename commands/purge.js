const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Delete multiple messages at once',
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages at once')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
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

        const amount = parseInt(args[0]);
        
        if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Invalid Amount')
                .setDescription('Please provide a valid number between 1 and 100.\n\n**Usage:** `!purge <amount>`\n**Example:** `!purge 10`')
                .setTimestamp();
            return message.channel.send({ embeds: [errorEmbed] });
        }

        try {
            await message.delete().catch(() => {});
            
            const deletedMessages = await message.channel.bulkDelete(amount, true);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('Messages Purged')
                .setDescription(`Successfully deleted **${deletedMessages.size}** messages.`)
                .setFooter({ text: `Purged by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            const confirmMsg = await message.channel.send({ embeds: [successEmbed] });
            setTimeout(() => {
                confirmMsg.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error purging messages:', error);
            
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

        const amount = interaction.options.getInteger('amount');

        try {
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle('Messages Purged')
                .setDescription(`Successfully deleted **${deletedMessages.size}** messages.`)
                .setFooter({ text: `Purged by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } catch (error) {
            console.error('Error purging messages:', error);
            
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
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
