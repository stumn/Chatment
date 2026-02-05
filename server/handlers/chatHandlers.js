const {
  getPostsByDisplayOrder,
  SaveChatMessage,
  updateSpaceStats,
  saveLog
} = require('../dbOperation');

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

  socket.on('chat-message', async ({ nickname, message, userId, spaceId }) => {
    try {
      // displayOrderの最後尾を取得（スペース別）
      const displayOrder = await getLastDisplayOrder(spaceId);

      // チャットメッセージデータ
      const messageData = {
        nickname,
        message,
        userId,
        displayOrder,
        spaceId
      };

      // DBにデータ保存
      const p = await SaveChatMessage(messageData);

      // Socket.IOのルーム機能により、スペース内の全参加者に送信
      io.to(String(spaceId)).emit('chat-message', p);

      // スペース統計をデータベースで更新
      await updateSpaceStats(spaceId, { $inc: { totalMessageCount: 1 } });

      // ログ記録 - チャットメッセージ
      saveLog({
        userId,
        userNickname: nickname,
        action: 'chat-message',
        detail: { nickname, message, displayOrder },
        spaceId
      });

    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupChatHandlers,
  getLastDisplayOrder
};
