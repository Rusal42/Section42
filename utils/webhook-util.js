async function sendAsFloofWebhook(message, options) {
  try {
    await message.channel.send(options);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

module.exports = { sendAsFloofWebhook };
