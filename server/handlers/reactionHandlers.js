const {
  processPostReaction,
  saveLog
} = require('../dbOperation');

const { getSpaceRoom } = require('../socketUtils');

// --- positive/negativeリアクションの共通ハンドラー ---
function setupReactionHandlers(socket, io) {

  const reactionTypes = ['positive', 'negative'];

  reactionTypes.forEach(reactionType => {

    socket.on(reactionType, async ({ postId }) => {
      try {
        // socket情報を使用（偽装防止）
        const userSocketId = socket.id;
        const nickname = socket.nickname;
        const spaceId = socket.spaceId;

        // spaceIdのバリデーション
        if (spaceId == null) {
          console.error(`${reactionType}: spaceId is not set`);
          return;
        }

        // リアクション処理
        const reactionResult = await processPostReaction(postId, userSocketId, nickname, reactionType);

        // reactionResultの存在確認
        if (!reactionResult) {
          console.error('⚠️ Reaction handler: reactionResult is falsy (post not found?)');
          return;
        }

        // 投稿が同じスペースに属しているかを検証（スペース隔離）
        // 型を正規化して比較（DBからはNumber、socketからはString/Numberの可能性）
        if (String(reactionResult.spaceId) !== String(spaceId)) {
          console.error(`⚠️ ${reactionType}: post ${postId} does not belong to space ${spaceId}`);
          return;
        }

        // ブロードキャスト用データの作成
        const broadcastData =
          reactionType === 'positive'
            ? { id: reactionResult.id, positive: reactionResult.reaction, userHasVotedPositive: reactionResult.userHasReacted }
            : { id: reactionResult.id, negative: reactionResult.reaction, userHasVotedNegative: reactionResult.userHasReacted };

        // スペース内にブロードキャスト
        io.to(getSpaceRoom(spaceId)).emit(reactionType, broadcastData);

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
