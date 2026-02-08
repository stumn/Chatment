const { addHeightMemory, getSpaceRoom } = require('../socketUtils');

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io, heightMemory) {

  socket.on('heightChange', (height) => {
    const spaceId = socket.spaceId;

    // 高さメモリに追加（spaceIdも含める）
    const heightArray = addHeightMemory(heightMemory, socket.id, height, spaceId);

    // スペース内の参加者の高さのみをフィルタリングしてブロードキャスト
    if (spaceId != null) {
      const spaceHeightArray = heightArray.filter(item => String(item.spaceId) === String(spaceId));
      io.to(getSpaceRoom(spaceId)).emit('heightChange', spaceHeightArray);
    } else {
      console.error('⚠️ heightChange handler: spaceId is required for space isolation');
    }

  });
}

module.exports = {
  setupUIHandlers
};
