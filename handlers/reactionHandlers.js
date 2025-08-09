const {
  processPostReaction,
  saveLog
} = require('../dbOperation');

const { SOCKET_EVENTS } = require('../constants');

// --- positive/negativeリアクションの共通ハンドラー ---
function setupReactionHandlers(socket, io) {

  const reactionTypes = [SOCKET_EVENTS.POSITIVE, SOCKET_EVENTS.NEGATIVE];

  reactionTypes.forEach(reactionType => {

    socket.on(reactionType, async ({ postId, userSocketId, nickname }) => {
      try {

        // リアクション処理
        const reactionResult = await processPostReaction(postId, userSocketId, nickname, reactionType);

        // ブロードキャスト用データの作成
        const broadcastData =
          reactionType === SOCKET_EVENTS.POSITIVE
            ? { id: reactionResult.id, positive: reactionResult.reaction, userHasVotedPositive: reactionResult.userHasReacted }
            : { id: reactionResult.id, negative: reactionResult.reaction, userHasVotedNegative: reactionResult.userHasReacted };

        // ブロードキャスト
        io.emit(reactionType, broadcastData);

        // ログ記録
        saveLog({ userId: reactionResult.userId, action: reactionType, detail: { postId, userSocketId, nickname } });

      } catch (e) { console.error(e); }
    });
  });
}

module.exports = {
  setupReactionHandlers
};
