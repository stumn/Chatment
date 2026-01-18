import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useDocEmitters = (socket, emitLog) => {

  const emitDocAdd = (payload) => {
    // const { userInfo } = useAppStore.getState();

    // spaceIdを追加(不要説)　ここでuserInfoを取得するから、元のpayloadにuser情報を載せないという手もある
    const payloadWithSpace = {
      ...payload,
      // spaceId: userInfo.spaceId
    };

    socket.emit('doc-add', payloadWithSpace);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-add',
      detail: payloadWithSpace
    });
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

      emitLog({
        userId: validUserId(userInfo && userInfo._id),
        userNickname: userInfo.nickname,
        action: 'doc-demand-lock',
        detail: data
      });
    });
  };

  const emitUnlockRow = (data) => {
    const { userInfo } = useAppStore.getState();
    console.log('[Lock] Emitting unlock-row:', data);

    socket.emit('unlock-row', data);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-unlock-row',
      detail: data
    });
  };

  const emitDocEdit = (payload) => {
    const { userInfo } = useAppStore.getState();

    // spaceIdを追加
    const payloadWithSpace = {
      ...payload,
      spaceId: userInfo.spaceId
    };

    socket.emit('doc-edit', payloadWithSpace);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-edit',
      detail: payloadWithSpace
    });
  };

  const emitDocReorder = (payload) => {
    const { userInfo } = useAppStore.getState();

    // 編集前の情報を取得
    const posts = window.__postStore?.getState?.().posts || [];
    const oldOrder = posts.map(p => ({ id: p.id, displayOrder: p.displayOrder }));

    // spaceIdを追加
    const payloadWithSpace = {
      ...payload,
      spaceId: userInfo.spaceId
    };

    socket.emit('doc-reorder', payloadWithSpace);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-reorder',
      detail: {
        ...payloadWithSpace,
        oldOrder: oldOrder
      }
    });
  };

  const emitDocDelete = (id) => {
    const { userInfo } = useAppStore.getState();
    socket.emit('doc-delete', { id });
    emitLog({ action: 'doc-delete', detail: { documentId: id } });
  };

  const emitIndentChange = (postId, newIndentLevel) => {
    const { userInfo } = useAppStore.getState();
    
    // 編集前の情報を取得
    const posts = window.__postStore?.getState?.().posts || [];
    const targetPost = posts.find(p => p.id === postId);
    const oldIndentLevel = targetPost?.indentLevel;
    
    const payload = {
      postId,
      newIndentLevel,
      nickname: userInfo.nickname,
      spaceId: userInfo.spaceId
    };

    console.log(payload);

    socket.emit('doc-indent-change', payload);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-indent-change',
      detail: {
        ...payload,
        oldIndentLevel,
        documentId: postId
      }
    });
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
