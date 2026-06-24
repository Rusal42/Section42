const fs = require('fs');
const path = require('path');
const { getDataPath } = require('../utils/dataPath');

const STORE_PATH = getDataPath('memberCounters.json');

function load() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function save(data) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Failed to save member counter store:', e);
    }
}

function getCounter(guildId) {
    return load()[guildId] || null;
}

function setCounter(guildId, channelId, format) {
    const data = load();
    data[guildId] = { channelId, format };
    save(data);
}

function removeCounter(guildId) {
    const data = load();
    delete data[guildId];
    save(data);
}

module.exports = { getCounter, setCounter, removeCounter };
