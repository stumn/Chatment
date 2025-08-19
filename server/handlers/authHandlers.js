const {
  saveUser,
  getPastLogs,
  getPostsByDisplayOrder,
} = require('../dbOperation');

const { SOCKET_EVENTS } = require('../constants');

// --- ログインハンドラー ---
async function handleLogin(socket, userInfo) {
  const { nickname, status, ageGroup } = userInfo;
  console.log('🙋login:', nickname, status, ageGroup, socket.id);

  try {

    // nickname, status, ageGroupが必須
    if (!nickname || !status || !ageGroup) {
      console.error('Invalid user info:', userInfo);
      return;
    }

    // ユーザをDBへ保存（TODO: nickname, status, ageGroupが全く同じ場合、同じユーザとして扱うためのロジックを追加）
    const newUser = await saveUser(nickname, status, ageGroup, socket.id);

    // TODO: ちゃんと確認する
    socket.userId = newUser._id.toString();
    socket.nickname = nickname;

    // ユーザログインが成功したことを通知
    socket.emit('connect OK', newUser);

    // チャット履歴取得ハンドラー（過去チャットログ 但し、ルーム機能を使うときは使われない）
    socket.on(SOCKET_EVENTS.FETCH_HISTORY, async () => {
      try {
        const messages = await getPastLogs(nickname);
        socket.emit('history', messages);
      } catch (e) { console.error(e); }
    });

    // ドキュメント用取得ハンドラー
    socket.on(SOCKET_EVENTS.FETCH_DOCS, async () => {
      try {
        const docs = await getPostsByDisplayOrder();
        socket.emit('docs', docs);
      } catch (e) { console.error(e); }
    });

  } catch (e) { console.error(e); }
}

module.exports = {
  handleLogin
};
