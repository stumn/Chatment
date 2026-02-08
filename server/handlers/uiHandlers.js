const { addHeightMemory, getSpaceRoom } = require('../socketUtils');

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io, heightMemory) {

  socket.on('heightChange', (height) => {
    const spaceId = socket.spaceId;

    // 高さメモリに追加（spaceIdも含める）
    const heightArray = addHeightMemory(heightMemory, socket.id, height, spaceId);

    // スペース内の参加者の高さのみをフィルタリングしてブロードキャスト
    if (spaceId) {
      const spaceHeightArray = heightArray.filter(item => item.spaceId === spaceId);
      io.to(getSpaceRoom(spaceId)).emit('heightChange', spaceHeightArray);
    } else {
      io.emit('heightChange', heightArray);
    }

  });
}

module.exports = {
  setupUIHandlers
};
