import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useDocEmitters = (socket, emitLog) => {

  const emitDocAdd = (payload) => {
    socket.emit('doc-add', payload);
  };

  const emitDemandLock = (data) => {
    const { userInfo } = useAppStore.getState();
    console.log('[Lock] Emitting demand-lock:', data);

    return new Promise((resolve, reject) => {
      // タイムアウト設定（3秒）
      const timeout = setTimeout(() => {
        console.warn('[Lock] Lock request timeout for:', data.rowElementId);
        reject(new Error('Lock request timeout'));
      }, 3000);

      // 一時的なリスナーを設定
      const onLockPermitted = (payload) => {
        if (payload.id === data.rowElementId) {
          clearTimeout(timeout);
          socket.off('Lock-permitted', onLockPermitted);
          socket.off('Lock-not-allowed', onLockNotAllowed);
          resolve(payload);
        }
      };

      const onLockNotAllowed = (payload) => {
        if (payload.id === data.rowElementId) {
          clearTimeout(timeout);
          socket.off('Lock-permitted', onLockPermitted);
          socket.off('Lock-not-allowed', onLockNotAllowed);
          reject(new Error(payload.message || 'Lock not allowed'));
        }
      };

      socket.on('Lock-permitted', onLockPermitted);
      socket.on('Lock-not-allowed', onLockNotAllowed);

      socket.emit('demand-lock', data);
    });
  };

  const emitUnlockRow = (data) => {
    console.log('[Lock] Emitting unlock-row:', data);
    socket.emit('unlock-row', data);
  };

  const emitDocEdit = (payload) => {
    const { userInfo } = useAppStore.getState();

    // spaceIdを追加
    const payloadWithSpace = {
      ...payload,
      spaceId: userInfo.spaceId
    };

    socket.emit('doc-edit', payloadWithSpace);
  };

  const emitDocReorder = (payload) => {
    const { userInfo } = useAppStore.getState();

    // spaceIdを追加
    const payloadWithSpace = {
      ...payload,
      spaceId: userInfo.spaceId
    };

    socket.emit('doc-reorder', payloadWithSpace);
  };

  const emitDocDelete = (id) => {
    socket.emit('doc-delete', { id });
  };

  const emitIndentChange = (postId, newIndentLevel) => {
    const { userInfo } = useAppStore.getState();

    const payload = {
      postId,
      newIndentLevel,
      nickname: userInfo.nickname,
      spaceId: userInfo.spaceId
    };

    console.log(payload);

    socket.emit('doc-indent-change', payload);
  };

  return {
    emitDocAdd,
    emitDemandLock,
    emitUnlockRow,
    emitDocEdit,
    emitDocReorder,
    emitDocDelete,
    emitIndentChange
  };
};
