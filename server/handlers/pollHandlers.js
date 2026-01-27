const { Post } = require('../db');
const { saveLog } = require('../dbOperation');

// --- アンケートハンドラーのセットアップ ---
function setupPollHandlers(socket, io) {

  // アンケート投票ハンドラー
  socket.on('poll-vote', async ({ postId, optionIndex, userId, nickname, roomId, spaceId }) => {
    try {
      // 投稿を取得
      const post = await Post.findById(postId);
      if (!post || !post.poll) {
        return socket.emit('poll-error', { message: 'アンケートが見つかりません' });
      }

      // 選択肢の存在確認
      if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
        return socket.emit('poll-error', { message: '無効な選択肢です' });
      }

      // 既に投票済みかチェック（全選択肢を確認）
      const hasVoted = post.poll.options.some(option => 
        option.votes.some(vote => vote.userId === userId)
      );

      if (hasVoted) {
        return socket.emit('poll-error', { message: '既に投票済みです' });
      }

      // 投票を追加
      post.poll.options[optionIndex].votes.push({
        userId,
        nickname: post.poll.isAnonymous ? '' : nickname
      });

      // 保存
      await post.save();

      // 投票結果を整形
      const pollData = {
        id: post.id,
        poll: {
          question: post.poll.question,
          options: post.poll.options.map(opt => ({
            label: opt.label,
            voteCount: opt.votes.length,
            voters: post.poll.isAnonymous ? [] : opt.votes.map(v => v.nickname).filter(n => n)
          })),
          isAnonymous: post.poll.isAnonymous,
          totalVotes: post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)
        }
      };

      // ルームの全員に更新を配信
      io.to(roomId).emit('poll-update', pollData);

      // ログ記録
      saveLog({ 
        userId, 
        action: 'poll-vote', 
        detail: { postId, optionIndex, nickname }, 
        spaceId 
      });

    } catch (error) {
      console.error('Poll vote error:', error);
      socket.emit('poll-error', { message: '投票に失敗しました' });
    }
  });
}

module.exports = {
  setupPollHandlers
};
