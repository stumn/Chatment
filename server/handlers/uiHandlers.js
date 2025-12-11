const { addHeightMemory } = require('../socketUtils');

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io, heightMemory) {

  socket.on('heightChange', (height) => {

    // 高さメモリに追加（spaceIdも含める）
    const heightArray = addHeightMemory(heightMemory, socket.id, height, socket.spaceId);

    // 高さメモリを全クライアントにブロードキャスト(TODO: 同じルームにいる人にだけ送信するのか検討)
    io.emit('heightChange', heightArray);

  });
}

module.exports = {
  setupUIHandlers
};
