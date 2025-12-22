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
    // data:{ `dc-${index}-${message?.displayOrder}-${message?.id}`, nickname }
    const { rowElementId, nickname } = data;

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
      detail: payloadWithSpace
    });
  };

  const emitDocDelete = (id) => {
    const { userInfo } = useAppStore.getState();
    socket.emit('doc-delete', { id });
    emitLog({ action: 'doc-delete', detail: { id } });
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

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-indent-change',
      detail: payload
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
