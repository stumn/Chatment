const { addHeightMemory, toStringSpaceId } = require('../socketUtils');

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io, heightMemory) {

  socket.on('heightChange', (height) => {
    const spaceId = socket.spaceId;

    // ログイン前はspaceIdがないため、イベントを無視する
    if (spaceId == null) {
      return;
    }

    // 高さメモリに追加（spaceIdも含める）
    const heightArray = addHeightMemory(heightMemory, socket.id, height, spaceId);

    // スペース内の参加者の高さのみをフィルタリングしてブロードキャスト
    const spaceHeightArray = heightArray.filter(item => String(item.spaceId) === String(spaceId));
    io.to(toStringSpaceId(spaceId)).emit('heightChange', spaceHeightArray);

  });
}

module.exports = {
  setupUIHandlers
};
