const {
  getPostsByDisplayOrder,
  SaveChatMessage,
  updateSpaceStats,
  saveLog
} = require('../dbOperation');

const { getSpaceRoom } = require('../socketUtils');

// --- displayOrderの最後尾を取得（ヘルパー）（スペース別） ---
async function getLastDisplayOrder(spaceId = null) {
  try {

    const posts = await getPostsByDisplayOrder(spaceId);
    const lastPost = posts[posts.length - 1];
    return lastPost ? lastPost.displayOrder + 1 : 1;

  } catch (error) { throw error; }
}

// --- チャットハンドラーのセットアップ ---
function setupChatHandlers(socket, io) {

  socket.on('chat-message', async ({ displayName, message }) => {
    try {
      // socket保存情報を使用（セキュリティと効率性の向上）
      const nickname = socket.nickname; // 本来のニックネーム
      const userId = socket.userId;
      const spaceId = socket.spaceId;

      // spaceIdのバリデーション
      if (spaceId == null) {
        console.error('chat-message: spaceId is not set');
        socket.emit('chat-error', { message: 'スペースに参加してください' });
        return;
      }

      // displayOrderの最後尾を取得（スペース別）
      const displayOrder = await getLastDisplayOrder(spaceId);

      // チャットメッセージデータ
      const messageData = {
        nickname, // 本来のニックネーム（記録用）
        displayName, // 選択された表示名（表示用）
        message,
        userId,
        displayOrder,
        spaceId
      };

      // DBにデータ保存
      const p = await SaveChatMessage(messageData);

      // Socket.IOのルーム機能により、スペース内の全参加者に送信
      io.to(getSpaceRoom(spaceId)).emit('chat-message', p);

      // スペース統計をデータベースで更新
      await updateSpaceStats(spaceId, { $inc: { totalMessageCount: 1 } });

      // ログ記録 - チャットメッセージ
      saveLog({
        userId,
        userNickname: nickname, // 本来のニックネーム
        action: 'chat-message',
        detail: { nickname, displayName, message, displayOrder },
        spaceId
      });

    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupChatHandlers,
  getLastDisplayOrder
};
