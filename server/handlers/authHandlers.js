const {
  saveUser,
  getPastLogs,
  getPostsByDisplayOrder,
} = require('../dbOperation');

// --- ログインハンドラー ---
async function handleLogin(socket, userInfo) {
  const { nickname, status, ageGroup, spaceId } = userInfo;
  console.log('🙋login:', nickname, status, ageGroup, 'spaceId:', spaceId, socket.id);

  try {

    // nickname, status, ageGroup, spaceIdが必須
    if (!nickname || !status || !ageGroup || !spaceId) {
      const errorMsg = 'ログイン情報が不完全です。nickname, status, ageGroup, spaceIdが必要です。';
      console.error(errorMsg, userInfo);
      socket.emit('login_error', {
        message: errorMsg,
        missing: {
          nickname: !nickname,
          status: !status,
          ageGroup: !ageGroup,
          spaceId: !spaceId
        }
      });
      return;
    }

    // ユーザをDBへ保存（スペース検証付き）
    const newUser = await saveUser(nickname, status, ageGroup, socket.id, spaceId);

    // TODO: ちゃんと確認する
    socket.userId = newUser._id.toString();
    socket.nickname = nickname;
    socket.spaceId = spaceId; // socketにspaceIdも保存

    // ユーザログインが成功したことを通知
    socket.emit('connect OK', newUser);

    // チャット履歴取得ハンドラー（スペース別の過去チャットログ）
    socket.on('fetch-history', async () => {
      try {
        const messages = await getPastLogs(spaceId);
        socket.emit('history', messages);
      } catch (e) { console.error(e); }
    });

    // ドキュメント用取得ハンドラー（スペース別のドキュメント）
    socket.on('fetch-docs', async () => {
      try {
        const docs = await getPostsByDisplayOrder(spaceId);
        socket.emit('docs', docs);
      } catch (e) { console.error(e); }
    });

  } catch (e) {
    console.error('ログインエラー:', e);

    // スペース関連のエラーかチェック
    if (e.message.includes('スペースID') || e.message.includes('存在しません') || e.message.includes('利用できません')) {
      socket.emit('login_error', {
        message: 'スペースエラー: ' + e.message,
        type: 'SPACE_ERROR'
      });
    } else {
      socket.emit('login_error', {
        message: 'ログイン処理中にエラーが発生しました',
        type: 'GENERAL_ERROR'
      });
    }
  }
}

module.exports = {
  handleLogin
};
