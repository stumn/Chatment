import usePostStore from '../../../store/spaces/postStore';

export const useLockHandlers = (emitLog) => {
  const handleLockPermitted = (payload) => {
    // payload: { id, nickname}
    // ロック許可時のUI更新処理を追加
    // 自分がロックを取得した場合なので、編集可能状態にする
    // この処理はコンポーネント側で handle する
  };

  const handleRowLocked = (payload) => {
    // payload: { id, nickname }

    // ロック状態をStoreで管理
    usePostStore.getState().lockRow(payload.id, {
      nickname: payload.nickname,
      lockedAt: new Date().toISOString()
    });
  };

  const handleRowUnlocked = (payload) => {
    // payload: { id, postId, reason? }

    // ストアからロック状態を削除
    usePostStore.getState().unlockRow(payload.id);
  };

  const handleLockNotAllowed = (payload) => {
    // ロックが許可されなかった場合、しばらくお待ち下さいと表示する
    alert(`ロックが許可されませんでした。しばらくお待ちください。`);
  };

  return {
    handleLockPermitted,
    handleRowLocked,
    handleRowUnlocked,
    handleLockNotAllowed
  };
};
