import usePostStore from '../../../store/spaces/postStore';

export const useLockHandlers = (emitLog) => {
  const handleLockPermitted = (payload) => {
    // payload: { id, nickname}
    console.log('[Lock] Lock-permitted received:', payload);
    // 自分がロックを取得した場合、ストアに反映
    usePostStore.getState().lockRow(payload.id, {
      nickname: payload.nickname,
      lockedAt: new Date().toISOString()
    });
  };

  const handleRowLocked = (payload) => {
    // payload: { id, nickname }
    console.log('[Lock] row-locked received:', payload);

    // ロック状態をStoreで管理
    usePostStore.getState().lockRow(payload.id, {
      nickname: payload.nickname,
      lockedAt: new Date().toISOString()
    });
  };

  const handleRowUnlocked = (payload) => {
    // payload: { id, postId, reason? }
    console.log('[Lock] row-unlocked received:', payload);

    // ストアからロック状態を削除
    usePostStore.getState().unlockRow(payload.id);
  };

  const handleLockNotAllowed = (payload) => {
    // ロックが許可されなかった場合、コンソールに警告を表示
    console.warn('[Lock] Lock-not-allowed received:', payload);
    console.warn(`ロックが許可されませんでした: ${payload.id}`, payload.message);
    // TODO: より適切なUI通知（トースト通知など）の実装を検討
  };

  return {
    handleLockPermitted,
    handleRowLocked,
    handleRowUnlocked,
    handleLockNotAllowed
  };
};
