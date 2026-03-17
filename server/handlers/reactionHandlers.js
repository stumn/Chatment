const {
  processPostReaction,
  saveLog
} = require('../dbOperation');

// --- positive/negativeリアクションの共通ハンドラー ---
function setupReactionHandlers(socket, io) {

  const reactionTypes = ['positive', 'negative'];

  reactionTypes.forEach(reactionType => {

    socket.on(reactionType, async ({ postId, userSocketId, nickname }) => {
      try {

        // リアクション処理
        const reactionResult = await processPostReaction(postId, userSocketId, nickname, reactionType);

        // ブロードキャスト用データの作成
        const broadcastData =
          reactionType === 'positive'
            ? { id: reactionResult.id, positive: reactionResult.reaction, userHasVotedPositive: reactionResult.userHasReacted }
            : { id: reactionResult.id, negative: reactionResult.reaction, userHasVotedNegative: reactionResult.userHasReacted };

        // ブロードキャスト
        io.emit(reactionType, broadcastData);

        // ログ記録 - リアクション
        saveLog({
          userId: socket.userId || reactionResult.userId,
          userNickname: socket.nickname || nickname,
          action: reactionType,
          detail: { postId },
          spaceId: socket.spaceId || reactionResult.spaceId,
          level: 'info',
          source: 'server'
        });

      } catch (e) { console.error(e); }
    });
  });
}

module.exports = {
  setupReactionHandlers
};
