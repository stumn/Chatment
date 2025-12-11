// ハンドラーモジュールのインポート
const { handleLogin } = require('./handlers/authHandlers');
const { setupChatHandlers } = require('./handlers/chatHandlers');
const { setupUIHandlers } = require('./handlers/uiHandlers');
const { setupReactionHandlers } = require('./handlers/reactionHandlers');
const { setupDocHandlers } = require('./handlers/docHandlers');
const { setupLockHandlers } = require('./handlers/lockHandlers');
const { setupRoomHandlers } = require('./handlers/roomHandlers');
const { setupLogHandlers } = require('./handlers/logHandlers');

const { SOCKET_EVENTS } = require('./constants');

// グローバル変数
const userSockets = new Map();
const lockedRows = new Map();
const rooms = new Map();
const userRooms = new Map();
const heightMemory = [];

// --- Socket.IOの初期化 ---
function initializeSocketHandlers(io) {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {

    console.log('a user connected', socket.id);

    // ログインハンドラー
    socket.on(SOCKET_EVENTS.LOGIN, async (userInfo) => {
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
