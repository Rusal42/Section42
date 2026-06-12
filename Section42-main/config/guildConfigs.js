const section42Config = {
    GUILD_ID: '1421592736221626572',
    NAME: 'Section42',
    SHORT_NAME: 'Section42',
    COLOR: '#ff6b35',
    FOOTER: 'Section42 Bot by crucifyym',

    WELCOME: {
        title: 'Welcome to Section42!',
        color: '#ff6b35',
        image: 'https://media.discordapp.net/attachments/1421592736221626572/1421592800008552498/section42-banner.png',
    },

    ROLES: {
        DEFAULT_ON_JOIN: 'Member',
    },

    CHANNELS: {
        WELCOME: 'welcome',
        RULES: 'rules',
    }
};

const cocConfig = require('../../CoC/guildConfig');

const testConfig = {
    ...section42Config,
    GUILD_ID: '1392710210862321694',
    NAME: 'Section42 (Test)',
    SHORT_NAME: 'Section42',
};

const GUILD_CONFIGS = {
    [section42Config.GUILD_ID]: section42Config,
    [testConfig.GUILD_ID]: testConfig,
    [cocConfig.GUILD_ID]: cocConfig,
};

function getGuildConfig(guildId) {
    return GUILD_CONFIGS[guildId] || section42Config;
}

module.exports = { GUILD_CONFIGS, getGuildConfig };
