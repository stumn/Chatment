import useAppStore from '../../../store/spaces/appStore';
import useRoomStore from '../../../store/spaces/roomStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useRoomEmitters = (socket, emitLog) => {

  const emitJoinRoom = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId || !userInfo) return;

    const joinData = {
      roomId,
      userId: userInfo._id,
      nickname: userInfo.nickname,
      userInfo: userInfo
    };

    socket.emit('join-room', joinData);

    emitLog({
      userId: validUserId(userInfo._id),
      userNickname: userInfo.nickname,
      action: 'join-room',
      detail: { roomId, nickname: userInfo.nickname }
    });
  };

  const emitLeaveRoom = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId || !userInfo) return;

    const leaveData = {
      roomId,
      userId: userInfo._id,
      nickname: userInfo.nickname
    };

    socket.emit('leave-room', leaveData);

    emitLog({
      userId: validUserId(userInfo._id),
      userNickname: userInfo.nickname,
      action: 'leave-room',
      detail: { roomId, nickname: userInfo.nickname }
    });
  };

  const emitGetRoomList = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('get-room-list', userInfo);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'get-room-list',
      detail: {}
    });
  };

  const emitGetRoomInfo = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId) return;

    socket.emit('get-room-info', { roomId });

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'get-room-info',
      detail: { roomId }
    });
  };

  const emitFetchRoomHistory = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId) return;

    // 既に履歴が読み込み済みの場合はスキップ
    if (useRoomStore.getState().isRoomHistoryLoaded(roomId)) {
      return;
    }

    const startTime = performance.now(); // パフォーマンス測定開始

    roomId === 'room-0' // ここはサーバ処理でも良さそう
      ? socket.emit('fetch-history', { roomId, startTime })
      : socket.emit('fetch-room-history', { roomId, startTime });

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'fetch-room-history',
      detail: { roomId, startTime }
    });
  };

  return {
    emitJoinRoom,
    emitLeaveRoom,
    emitGetRoomList,
    emitGetRoomInfo,
    emitFetchRoomHistory
  };
};
