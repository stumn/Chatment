// logOperations.js
const { Log } = require('../db');
const { handleErrors } = require('../utils');

// ログを保存（spaceId対応）
async function saveLog({ userId, userNickname = '', action, detail, spaceId = null }) {
    try {
        const logData = { 
            userId, 
            userNickname, 
            action, 
            detail, 
            timestamp: new Date()
        };
        
        // spaceIdが指定されている場合は追加
        if (spaceId) {
            logData.spaceId = spaceId;
        }
        
        await Log.create(logData);
    } catch (e) {
        handleErrors(e, 'ログ記録失敗:');
    }
}

module.exports = {
    saveLog
};
