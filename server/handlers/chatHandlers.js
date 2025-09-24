const {
  getPostsByDisplayOrder,
  SaveChatMessage,
  updateRoomStats,
  saveLog
} = require('../dbOperation');

const { SOCKET_EVENTS } = require('../constants');

// --- displayOrderの最後尾を取得（ヘルパー） ---
async function getLastDisplayOrder() {
  try {

    const posts = await getPostsByDisplayOrder();
    const lastPost = posts[posts.length - 1];
    return lastPost ? lastPost.displayOrder + 1 : 1;

  } catch (error) { throw error; }
}

// --- チャットハンドラーのセットアップ ---
function setupChatHandlers(socket, io, rooms) {

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ nickname, message, userId, roomId, spaceId = 1 }) => {
    try {
      // displayOrderの最後尾を取得
      const displayOrder = await getLastDisplayOrder();

      // チャットメッセージデータ（ルーム情報とスペース情報も含める）
      const messageData = {
        nickname,
        message,
        userId,
        displayOrder,
        spaceId, // スペースIDを追加
        ...(roomId && { roomId })
      };

      // DBにデータ保存
      const p = await SaveChatMessage(messageData);

      // ルームメッセージの場合は、Socket.IOルーム機能で効率的に配信
      if (roomId && rooms.has(roomId)) {

        console.log(`🏠 [server] Socket.IO ルーム room-${roomId} にメッセージ送信`);

        // Socket.IOのルーム機能により、該当ルームの全参加者に即座に送信
        const responseData = { ...p, roomId };
        io.to(`room-${roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, responseData);

        // ルーム統計をデータベースで更新
        await updateRoomStats(roomId, { $inc: { messageCount: 1 } });
      }

      // ログ記録
      saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder, roomId } });

    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupChatHandlers,
  getLastDisplayOrder
};
