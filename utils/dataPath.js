const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config/constants');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function getDataPath(...subPath) {
    ensureDataDir();
    return path.join(DATA_DIR, ...subPath);
}

module.exports = {
    DATA_DIR,
    getDataPath,
    ensureDataDir
};
