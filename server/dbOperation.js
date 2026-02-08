// dbOperation.js - メインエントリーポイント（後方互換性のため）
// 各機能ファイルからインポートして再エクスポート

const userOperations = require('./db/userOperations');
const postOperations = require('./db/postOperations');
const docOperations = require('./db/docOperations');
const logOperations = require('./db/logOperations');
const spaceOperations = require('./db/spaceOperations');

module.exports = {
    // ユーザー関連操作
    ...userOperations,

    // 投稿関連操作
    ...postOperations,

    // ドキュメント関連操作
    ...docOperations,

    // ログ関連操作
    ...logOperations,

    // スペース関連操作
    ...spaceOperations
};
