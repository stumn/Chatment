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

        // reactionResultの存在確認
        if (!reactionResult) {
          console.error('⚠️ Reaction handler: reactionResult is falsy (post not found?)');
          return;
        }

        // ブロードキャスト用データの作成
        const broadcastData =
          reactionType === 'positive'
            ? { id: reactionResult.id, positive: reactionResult.reaction, userHasVotedPositive: reactionResult.userHasReacted }
            : { id: reactionResult.id, negative: reactionResult.reaction, userHasVotedNegative: reactionResult.userHasReacted };

        // スペース内にブロードキャスト（spaceIdは必須）
        const spaceId = reactionResult.spaceId ?? socket.spaceId;
        if (spaceId != null) {
          io.to(getSpaceRoom(spaceId)).emit(reactionType, broadcastData);
        } else {
          console.error('⚠️ Reaction handler: spaceId is required for space isolation');
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
