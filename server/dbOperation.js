// dbOperation.js - メインエントリーポイント（後方互換性のため）
// 各機能ファイルからインポートして再エクスポート

const userOperations = require('./db/userOperations');
const postOperations = require('./db/postOperations');
const docOperations = require('./db/docOperations');
const roomOperations = require('./db/roomOperations');
const roomManagement = require('./db/roomManagement');
const logOperations = require('./db/logOperations');
const spaceOperations = require('./db/spaceOperations');

module.exports = {
    // ユーザー関連操作
    ...userOperations,
    
    // 投稿関連操作
    ...postOperations,
    
    // ドキュメント関連操作
    ...docOperations,
    
    // ルーム関連操作
    ...roomOperations,
    
    // ルーム管理操作
    ...roomManagement,
    
    // ログ関連操作
    ...logOperations,
    
    // スペース関連操作
    ...spaceOperations
};
