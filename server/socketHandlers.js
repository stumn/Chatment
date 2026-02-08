// ハンドラーモジュールのインポート
const { handleLogin, setupHistoryHandlers } = require('./handlers/authHandlers');
const { setupChatHandlers } = require('./handlers/chatHandlers');
const { setupUIHandlers } = require('./handlers/uiHandlers');
const { setupReactionHandlers } = require('./handlers/reactionHandlers');
const { setupDocHandlers } = require('./handlers/docHandlers');
const { setupLockHandlers } = require('./handlers/lockHandlers');
const { setupLogHandlers } = require('./handlers/logHandlers');
const { removeHeightMemory, unlockAllBySocketId, getSpaceRoom } = require('./socketUtils');

// グローバル変数
const userSockets = new Map();
const lockedRows = new Map();
const spaceParticipants = new Map(); // スペースごとの参加者管理 (spaceId -> Set of userId)
const heightMemory = [];

// --- Socket.IOの初期化 ---
function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {

    console.log('a user connected', socket.id);

    // ログインハンドラー
    socket.on('login', async (userInfo) => {
      await handleLogin(socket, userInfo);

      // ログイン後にuserSocketsにソケットを追加（userIdが設定されている場合のみ）
      if (socket.userId) {
        userSockets.set(socket.userId, socket);
      }

      // スペースに参加（Socket.IOルーム機能を使用）
      // handleLoginで設定されたsocket.spaceIdを信頼
      const spaceId = socket.spaceId;
      if (spaceId != null) {
        socket.join(getSpaceRoom(spaceId));

        // スペース参加者を管理（userIdが設定されている場合のみ）
        if (socket.userId) {
          if (!spaceParticipants.has(spaceId)) {
            spaceParticipants.set(spaceId, new Set());
          }
          spaceParticipants.get(spaceId).add(socket.userId);
        }

        console.log(`📍 [server] ${userInfo.nickname} がスペース ${spaceId} に参加`);
      }
    });

    // その他のイベントハンドラー（connection時に一度だけ登録）
    setupHistoryHandlers(socket); // 履歴取得ハンドラー
    setupChatHandlers(socket, io);
    setupUIHandlers(socket, io, heightMemory);
    setupReactionHandlers(socket, io);
    setupDocHandlers(socket, io, lockedRows);
    setupLockHandlers(socket, io, lockedRows);
    setupLogHandlers(socket, io);

    // 切断時の処理
    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);
      const spaceId = socket.spaceId;

      // heightMemoryから削除
      const heightArray = removeHeightMemory(heightMemory, socket.id);

      // スペース内の参加者の高さのみをフィルタリングしてブロードキャスト
      if (spaceId != null) {
        const spaceHeightArray = heightArray.filter(item => item.spaceId === spaceId);
        io.to(getSpaceRoom(spaceId)).emit('heightChange', spaceHeightArray);
      }

      // このsocketが保持している全てのロックを解放
      const unlockedCount = unlockAllBySocketId(lockedRows, io, socket.id, spaceId);
      if (unlockedCount > 0) {
        console.log(`🔓 [server] ${socket.nickname || socket.id} のロック ${unlockedCount}件を解放`);
      }

      // userSocketsから削除
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }

      // スペースから退出
      if (spaceId != null && spaceParticipants.has(spaceId)) {
        spaceParticipants.get(spaceId).delete(socket.userId);
        const participantCount = spaceParticipants.get(spaceId).size;

        // スペース内の他の参加者に退出を通知
        io.to(getSpaceRoom(spaceId)).emit('user-left', {
          spaceId: spaceId,
          userId: socket.userId,
          nickname: socket.nickname,
          participantCount: participantCount
        });

        // 最後の参加者が退出した場合はメモリから削除（メモリリーク防止）
        if (participantCount === 0) {
          spaceParticipants.delete(spaceId);
          console.log(`🗑️ [server] スペース ${spaceId} の参加者リストを削除（空）`);
        }

        console.log(`👋 [server] ${socket.nickname || socket.id} がスペース ${spaceId} から退出`);
      }
    });
  });
}

module.exports = {
  initializeSocketHandlers,
  userSockets,
  lockedRows,
  spaceParticipants,
  heightMemory
};
