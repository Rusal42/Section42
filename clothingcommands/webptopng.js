const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');

async function downloadAttachment(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

module.exports = {
    name: 'webptopng',
    description: 'Convert any image to a PNG file',
    data: new SlashCommandBuilder()
        .setName('webptopng')
        .setDescription('Convert any image to a PNG file')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to convert')
                .setRequired(true)
        ),

    async execute(message, args) {
        const attachment = message.attachments.first();
        if (!attachment) {
            return message.reply('Please attach an image to convert.');
        }

        if (!attachment.contentType?.startsWith('image/')) {
            return message.reply('Attached file must be an image.');
        }

        try {
            await message.channel.send('Converting to PNG...');
            const imageBuffer = await downloadAttachment(attachment.url);
            const pngBuffer = await sharp(imageBuffer).png().toBuffer();
            const outputAttachment = new AttachmentBuilder(pngBuffer, { name: 'converted.png' });

            return message.channel.send({ files: [outputAttachment] });
        } catch (error) {
            console.error('webptopng error:', error);
            return message.reply('Something went wrong while converting the image.');
        }
    },

    async executeSlash(interaction) {
        const attachment = interaction.options.getAttachment('image');
        if (!attachment) {
            return interaction.reply({ content: 'Please attach an image to convert.', ephemeral: true });
        }

        if (!attachment.contentType?.startsWith('image/')) {
            return interaction.reply({ content: 'Attached file must be an image.', ephemeral: true });
        }

        try {
            await interaction.reply({ content: 'Converting to PNG...' });
            const imageBuffer = await downloadAttachment(attachment.url);
            const pngBuffer = await sharp(imageBuffer).png().toBuffer();
            const outputAttachment = new AttachmentBuilder(pngBuffer, { name: 'converted.png' });

            return interaction.editReply({ content: null, files: [outputAttachment] });
        } catch (error) {
            console.error('webptopng error:', error);
            return interaction.editReply({ content: 'Something went wrong while converting the image.' });
        }
    }
};
