const { addHeightMemory } = require('../socketUtils');
const { SOCKET_EVENTS } = require('../constants');

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io, heightMemory) {

  socket.on(SOCKET_EVENTS.HEIGHT_CHANGE, (height) => {

    // 高さメモリに追加（spaceIdも含める）
    const heightArray = addHeightMemory(heightMemory, socket.id, height, socket.spaceId);

    // 高さメモリを全クライアントにブロードキャスト(TODO: 同じルームにいる人にだけ送信するのか検討)
    io.emit(SOCKET_EVENTS.HEIGHT_CHANGE, heightArray);

  });
}

module.exports = {
  setupUIHandlers
};
