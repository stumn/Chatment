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

    socket.emit('join-space', joinData);
  };

  const emitLeaveRoom = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId || !userInfo) return;

    const leaveData = {
      roomId,
      userId: userInfo._id,
      nickname: userInfo.nickname
    };

    socket.emit('leave-space', leaveData);
  };

  const emitGetRoomList = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('get-space-info', userInfo);
  };

  const emitGetRoomInfo = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId) return;

    socket.emit('get-space-info', { roomId });
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
      : socket.emit('fetch-space-history', { roomId, startTime });
  };

  return {
    emitJoinRoom,
    emitLeaveRoom,
    emitGetRoomList,
    emitGetRoomInfo,
    emitFetchRoomHistory
  };
};
