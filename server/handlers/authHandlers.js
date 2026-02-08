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
    if (!nickname || !status || !ageGroup || spaceId == null) {
      const errorMsg = 'ログイン情報が不完全です。nickname, status, ageGroup, spaceIdが必要です。';
      console.error(errorMsg, userInfo);
      socket.emit('login_error', {
        message: errorMsg,
        missing: {
          nickname: !nickname,
          status: !status,
          ageGroup: !ageGroup,
          spaceId: spaceId == null
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

// --- 履歴取得ハンドラー（connection時に一度だけ登録） ---
function setupHistoryHandlers(socket) {
  // チャット履歴取得ハンドラー（スペース別の過去チャットログ）
  socket.on('fetch-history', async () => {
    try {
      // socket.spaceIdを使用して最新のスペースIDを参照
      const currentSpaceId = socket.spaceId;
      if (currentSpaceId == null) {
        console.warn('⚠️ fetch-history: spaceIdが未設定です');
        socket.emit('history', { messages: [], spaceId: null });
        return;
      }
      const messages = await getPastLogs(currentSpaceId);
      socket.emit('history', { messages, spaceId: currentSpaceId });
    } catch (e) { console.error('fetch-historyエラー:', e); }
  });

  // ドキュメント用取得ハンドラー（スペース別のドキュメント）
  socket.on('fetch-docs', async () => {
    try {
      // socket.spaceIdを使用して最新のスペースIDを参照
      const currentSpaceId = socket.spaceId;
      if (currentSpaceId == null) {
        console.warn('⚠️ fetch-docs: spaceIdが未設定です');
        socket.emit('docs', { docs: [], spaceId: null });
        return;
      }
      const docs = await getPostsByDisplayOrder(currentSpaceId);
      socket.emit('docs', { docs, spaceId: currentSpaceId });
    } catch (e) { console.error('fetch-docsエラー:', e); }
  });
}

module.exports = {
  handleLogin,
  setupHistoryHandlers
};
