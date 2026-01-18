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
            ...(typeof detail === 'object' && detail !== null ? detail : { detail }),
            spaceId,
            detail: detail,
        };

        await Log.create(logData);
    } catch (e) {
        handleErrors(e, 'ログ記録失敗:');
    }
}

module.exports = {
    saveLog
};
