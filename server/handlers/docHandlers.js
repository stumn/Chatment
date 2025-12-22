const {
  getPostsByDisplayOrder,
  addDocRow,
  updatePostData,
  updateDisplayOrder,
  deleteDocRow,
  saveLog,
  updateIndentLevel
} = require('../dbOperation');

const {
  calculateDisplayOrder,
  detectInsertPosition,
  unlockRowByPostId,
} = require('../socketUtils');

// --- ドキュメントハンドラーのセットアップ ---
function setupDocHandlers(socket, io, lockedRows) {

  socket.on('doc-add', async (payload) => {
    try {

      // prevDisplayOrder(行追加する1つ前の行)を取得
      let prevDisplayOrder = payload.prevDisplayOrder;

      // prevDisplayOrderが指定されていない場合は行追加を拒否
      if (prevDisplayOrder === undefined || !Number.isFinite(prevDisplayOrder)) {
        console.warn('❌ DOC_ADD拒否: prevDisplayOrderが未指定または不正', payload);
        socket.emit('doc-error', {
          error: 'DOC_ADD',
          message: '行の追加位置が指定されていません。再度お試しください。'
        });
        return;
      }

      // 現在の行の並び順を取得(TODO: DB関連の処理が多いので、docOperationへの移行を検討)
      const posts = await getPostsByDisplayOrder(payload.spaceId);

      // DB保存
      const newPost = await addDocRow({
        nickname: payload.nickname,
        msg: payload.msg || '',
        displayOrder: detectInsertPosition(prevDisplayOrder, posts),
        spaceId: payload.spaceId, // spaceIdを追加
        indentLevel: payload.indentLevel || 0, // インデントレベルを追加
      });

      // 新規行追加の結果を整形
      const data = {
        id: newPost.id,
        nickname: newPost.nickname,
        msg: newPost.msg,
        displayOrder: newPost.displayOrder,
        indentLevel: newPost.indentLevel || 0
      };

      // 新規行追加を全クライアントにブロードキャスト
      io.emit('doc-add', data);

      // ログ記録
      saveLog({ userId: newPost.userId, action: 'doc-add', detail: data, spaceId: payload.spaceId });

    } catch (e) { console.error(e); }
  });

  socket.on('doc-edit', async (payload) => {
    try {

      // 行IDが指定されていないときは、編集したユーザにエラーを通知
      if (!payload.id) {
        console.warn('❌ DOC_EDIT拒否: idが未指定または不正', payload);
        socket.emit('doc-error', {
          error: 'DOC_EDIT',
          message: '申し訳ございません。行編集でエラーが発生しました。'
        });
        return;
      }

      // 編集した内容をチェックする
      // まず、#から始まる見出しの場合には、チャットに送信しない
      // 文章内容の変更が無い場合には、編集したとみなさない
      // (これらのチェックはクライアント側でも行うが、念のためサーバー側でも実施)

      // DBに編集を保存
      const updatedPost = await updatePostData(payload);

      // updatedAtをpayloadに追加してemit
      io.emit('doc-edit', { ...payload, updatedAt: updatedPost.updatedAt });

      // 編集完了時にロック解除
      unlockRowByPostId(lockedRows, io, payload.id);

      // ログ記録
      saveLog({ userId: null, action: 'doc-edit', detail: payload, spaceId: payload.spaceId });

    } catch (e) { console.error(e); }
  });

  socket.on('doc-reorder', async (payload) => {
    try {

      // 受信データをデストラクション
      const {
        nickname,
        movedPostId,
        movedPostDisplayOrder,
        prev,
        next,
        spaceId
      } = payload;

      // prevとnext から新しいdisplayOrderを計算
      const newDisplayOrder = calculateDisplayOrder(prev, next);

      // DB更新
      await updateDisplayOrder(movedPostId, newDisplayOrder);

      // 全クライアントに並び替えをブロードキャスト（スペース別）
      const posts = await getPostsByDisplayOrder(spaceId);

      // 並び替え情報に実行者の情報を含めて送信
      io.emit('doc-reorder', {
        posts: posts,
        reorderInfo: {
          movedPostId: movedPostId,
          executorNickname: nickname
        }
      });

      // 並び替え完了時にロック解除
      unlockRowByPostId(lockedRows, io, movedPostId);

      // ログ記録
      saveLog({ userId: null, userNickname: nickname, action: 'doc-reorder', detail: payload, spaceId });

    } catch (e) { console.error(e); }
  });

  socket.on('doc-delete', async (payload) => {
    try {

      // 行削除処理
      const deleted = await deleteDocRow(payload.id);

      // 削除結果を全クライアントにブロードキャスト
      if (deleted) {

        io.emit('doc-delete', { id: payload.id });

        // ログ記録
        saveLog({ userId: null, action: 'doc-delete', detail: payload });
      }

    } catch (e) { console.error(e); }
  });

  socket.on('doc-indent-change', async (payload) => {
    try {
      console.log(payload);
      const { postId, newIndentLevel, nickname, spaceId } = payload;

      // バリデーション
      if (!postId || newIndentLevel === undefined) {
        console.warn('❌ DOC_INDENT_CHANGE拒否: postIdまたはnewIndentLevelが未指定', payload);
        socket.emit('doc-error', {
          error: 'DOC_INDENT_CHANGE',
          message: 'インデント変更でエラーが発生しました。'
        });
        return;
      }

      // DB更新
      const updatedPost = await updateIndentLevel(postId, newIndentLevel);
      console.log(updatedPost);

      if (updatedPost) {
        // 全クライアントにインデント変更をブロードキャスト
        io.emit('doc-indent-change', {
          postId,
          indentLevel: updatedPost.indentLevel
        });

        // ログ記録
        saveLog({ userId: null, userNickname: nickname, action: 'doc-indent-change', detail: payload, spaceId });
      }

    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupDocHandlers
};
