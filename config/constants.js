const path = require('path');

module.exports = {
    OWNER_IDS: [
        '746068840978448565',
        '730862576316973168'
    ],
    DEV_MODE: process.env.DEV_MODE === 'true',
    QUARANTINE_CONFIG: {
        TICKET_CHANNEL_ID: '1421914220198629520',
        TICKET_LOG_CHANNEL_ID: '1421914221767299258',
        SUPPORT_TICKETS_CATEGORY_ID: '1421914185079717980'
    },
    // Set SECTION42_DATA_DIR env var to keep JSON data on the Chromebook (e.g. /home/user/section42-data)
    DATA_DIR: process.env.SECTION42_DATA_DIR || path.join(__dirname, '..', 'data')
};
