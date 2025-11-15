const {
  getPostsByDisplayOrder,
  SaveChatMessage,
  updateRoomStats,
  saveLog
} = require('../dbOperation');

const { SOCKET_EVENTS } = require('../constants');

// --- displayOrderの最後尾を取得（ヘルパー）（スペース別） ---
async function getLastDisplayOrder(spaceId = null) {
  try {

    const posts = await getPostsByDisplayOrder(spaceId);
    const lastPost = posts[posts.length - 1];
    return lastPost ? lastPost.displayOrder + 1 : 1;

  } catch (error) { throw error; }
}

// --- チャットハンドラーのセットアップ ---
function setupChatHandlers(socket, io, rooms) {

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ nickname, message, userId, roomId, spaceId }) => {
    try {
      // displayOrderの最後尾を取得（スペース別）
      const displayOrder = await getLastDisplayOrder(spaceId);

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

      // Socket.IOのルーム機能により、該当ルームの全参加者に即座に送信
      const responseData = { ...p, roomId };

      // メッセージをルームに送信
      io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, responseData);

      // デバッグ: このルームにいるソケットを確認（送信後に非同期で取得）
      io.in(roomId).fetchSockets().then(socketsInRoom => {
        console.log(`📤 [chatHandlers] メッセージをルームに送信: ${roomId}`, {
          messagePreview: message.substring(0, 50),
          roomId,
          hasRoomId: !!roomId,
          socketsInRoom: socketsInRoom.length,
          socketIds: socketsInRoom.map(s => s.id)
        });
      }).catch(e => {
        console.error(`[chatHandlers] fetchSockets error for room ${roomId}:`, e);
      });
      // ルーム統計をデータベースで更新
      await updateRoomStats(roomId, { $inc: { messageCount: 1 } });

      // ログ記録
      saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder, roomId }, spaceId });

    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupChatHandlers,
  getLastDisplayOrder
};
