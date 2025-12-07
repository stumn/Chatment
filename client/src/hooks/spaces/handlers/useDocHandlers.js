import usePostStore from '../../../store/spaces/postStore';

export const useDocHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);
  const updatePost = usePostStore((state) => state.updatePost);
  const reorderPost = usePostStore((state) => state.reorderPost);
  const setChangeState = usePostStore((state) => state.setChangeState);

  const handleDocAdd = (payload) => {
    console.log('handleDocAdd called with payload:', payload);
    // 新規作成として変更状態を記録
    addMessage(payload, true, payload.roomId);
    console.log('addMessage called with isNewlyCreated=true');
  };

  const handleDocEdit = (payload) => {
    updatePost(payload.id, payload.newMsg, payload.nickname, payload.updatedAt);
  };

  const handleDocReorder = (payload) => {
    // サーバーからの新しい形式に対応
    if (payload.posts && payload.reorderInfo) {
      // サーバーから渡されたIDと新しいdisplayOrderでstoreを更新
      reorderPost(payload.posts);

      // 並び替えされた投稿の変更状態を記録（全クライアントで表示）
      setChangeState(
        payload.reorderInfo.movedPostId,
        'reordered',
        payload.reorderInfo.executorNickname
      );
    }
  };

  const handleDocDelete = (payload) => {
    usePostStore.getState().removePost(payload.id);
  };

  const handleDocError = (data) => {
    // data: { error, message }
    console.error('Doc error:', data);

    // ユーザーに分かりやすいアラートも表示
    alert(`❌ ${data.message || 'ドキュメント編集中にエラーが発生しました'}`);
  };

  return {
    handleDocAdd,
    handleDocEdit,
    handleDocReorder,
    handleDocDelete,
    handleDocError
  };
};
