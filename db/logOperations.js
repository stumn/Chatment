// logOperations.js
const { mongoose, User, Post, Log, Room } = require('../db');
const { handleErrors } = require('../utils');

// ログを保存
async function saveLog({ userId, userNickname = '', action, detail }) {
    try {
        await Log.create({ userId, userNickname, action, detail, timestamp: new Date() });
    } catch (e) {
        // ログ記録失敗時も他機能に影響しない
        handleErrors(e, 'ログ記録失敗:');
    }
}

module.exports = {
    saveLog
};
