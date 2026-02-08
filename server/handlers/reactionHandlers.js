const {
  processPostReaction,
  saveLog
} = require('../dbOperation');

const { getSpaceRoom } = require('../socketUtils');

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

        // スペース内にブロードキャスト
        const spaceId = reactionResult.spaceId || socket.spaceId;
        if (spaceId) {
          io.to(getSpaceRoom(spaceId)).emit(reactionType, broadcastData);
        } else {
          io.emit(reactionType, broadcastData);
        }

        // ログ記録 - リアクション
        saveLog({
          userId: reactionResult.userId,
          userNickname: nickname,
          action: reactionType,
          detail: { postId, userSocketId, nickname },
          spaceId: reactionResult.spaceId
        });

      } catch (e) { console.error(e); }
    });
  });
}

module.exports = {
  setupReactionHandlers
};
