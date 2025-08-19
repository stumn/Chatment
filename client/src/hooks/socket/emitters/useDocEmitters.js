import useAppStore from '../../../store/appStore';
import { validUserId } from '../utils/socketUtils';

export const useDocEmitters = (socket, emitLog) => {
  const emitDocAdd = (payload) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitDocAdd', payload);
    socket.emit('doc-add', payload);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-add',
      detail: payload
    });
  };

  const emitDemandLock = (data) => {
    const { userInfo } = useAppStore.getState();
    // data:{ `dc-${index}-${message?.displayOrder}-${message?.id}`, nickname }
    const { rowElementId, nickname } = data;
    console.log('emitDemandLock', { rowElementId, nickname });

    socket.emit('demand-lock', data);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-demand-lock',
      detail: data
    });
  };

  const emitUnlockRow = (data) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitUnlockRow', data);

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
    console.log('emitDocEdit', payload);
    socket.emit('doc-edit', payload);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-edit',
      detail: payload
    });
  };

  const emitDocReorder = (payload) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitDocReorder', payload);
    
    socket.emit('doc-reorder', payload);
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-reorder',
      detail: payload
    });
  };

  const emitDocDelete = (id) => {
    const { userInfo } = useAppStore.getState();
    socket.emit('doc-delete', { id });
    emitLog({ action: 'doc-delete', detail: { id } });
  };

  return {
    emitDocAdd,
    emitDemandLock,
    emitUnlockRow,
    emitDocEdit,
    emitDocReorder,
    emitDocDelete
  };
};
