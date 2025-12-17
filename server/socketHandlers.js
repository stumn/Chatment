// ハンドラーモジュールのインポート
const { handleLogin } = require('./handlers/authHandlers');
const { setupChatHandlers } = require('./handlers/chatHandlers');
const { setupUIHandlers } = require('./handlers/uiHandlers');
const { setupReactionHandlers } = require('./handlers/reactionHandlers');
const { setupDocHandlers } = require('./handlers/docHandlers');
const { setupLockHandlers } = require('./handlers/lockHandlers');
const { setupRoomHandlers } = require('./handlers/roomHandlers');
const { setupLogHandlers } = require('./handlers/logHandlers');
const { removeHeightMemory, unlockAllBySocketId } = require('./socketUtils');

// グローバル変数
const userSockets = new Map();
const lockedRows = new Map();
const rooms = new Map();
const userRooms = new Map();
const heightMemory = [];

// --- Socket.IOの初期化 ---
function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {

    console.log('a user connected', socket.id);

    // ログインハンドラー
    socket.on('login', async (userInfo) => {
      await handleLogin(socket, userInfo);
      // ログイン後にuserSocketsにソケットを追加
      userSockets.set(socket.userId, socket);
    });

    // その他のイベントハンドラー
    setupChatHandlers(socket, io);
    setupUIHandlers(socket, io, heightMemory);
    setupReactionHandlers(socket, io);
    setupDocHandlers(socket, io, lockedRows);
    setupRoomHandlers(socket, io, rooms, userRooms, userSockets);
    setupLockHandlers(socket, io, lockedRows);
    setupLogHandlers(socket, io);

    // 切断時の処理
    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);

      // heightMemoryから削除
      const heightArray = removeHeightMemory(heightMemory, socket.id);
      io.emit('heightChange', heightArray);

      // このsocketが保持している全てのロックを解放
      const unlockedCount = unlockAllBySocketId(lockedRows, io, socket.id);
      if (unlockedCount > 0) {
        console.log(`🔓 [server] ${socket.nickname || socket.id} のロック ${unlockedCount}件を解放`);
      }

      // userSocketsから削除
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }

      // ルームから退出
      const currentRoomId = userRooms.get(socket.userId);
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId);
        room.participants.delete(socket.userId);
        userRooms.delete(socket.userId);

        // 他の参加者に退出を通知
        room.participants.forEach(participantUserId => {
          const participantSocket = userSockets.get(participantUserId);
          if (participantSocket) {
            participantSocket.emit('user-left', {
              roomId: currentRoomId,
              userId: socket.userId,
              nickname: socket.nickname,
              participantCount: room.participants.size
            });
          }
        });
      }
    });
  });
}

module.exports = {
  initializeSocketHandlers,
  userSockets,
  lockedRows,
  rooms,
  userRooms,
  heightMemory
};
