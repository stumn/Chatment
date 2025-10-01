import usePostStore from '../../../../store/spaces/postStore';
import useRoomStore from '../../../../store/spaces/roomStore';
import useAppStore from '../../../../store/spaces/appStore';
import { validUserId } from '../utils/socketUtils';

export const useRoomHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);
  const getRoomMessages = usePostStore((state) => state.getRoomMessages);

  const handleRoomJoined = (data) => {
    // data: { roomId, roomInfo, participants }
    console.log('Room joined:', data);

    // 参加者数を更新
    if (data.roomInfo && data.roomInfo.participantCount) {
      useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.roomInfo.participantCount);
    }

    // 現在のルームを更新
    useRoomStore.getState().setActiveRoom(data.roomId);

    // postStoreの表示をルーム用に切り替え（キャッシュから復元）
    const cachedMessages = getRoomMessages(data.roomId);
    if (cachedMessages) {
      usePostStore.getState().setPosts(cachedMessages);
    }

    const userInfo = useAppStore.getState().userInfo;
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'room-joined',
      detail: { roomId: data.roomId, participantCount: data.roomInfo?.participantCount }
    });
  };

  const handleRoomLeft = (data) => {
    // data: { roomId, participantCount }
    console.log('Room left:', data);

    // 参加者数を更新
    useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);

    const userInfo = useAppStore.getState().userInfo;
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'room-left',
      detail: { roomId: data.roomId, participantCount: data.participantCount }
    });
  };

  const handleUserJoined = (data) => {
    // data: { roomId, userId, nickname, participantCount }
    console.log('User joined room:', data);

    // 参加者数を更新
    useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);

    emitLog({
      userId: validUserId(data.userId),
      userNickname: data.nickname,
      action: 'user-joined',
      detail: { roomId: data.roomId, participantCount: data.participantCount }
    });
  };

  const handleUserLeft = (data) => {
    // data: { roomId, userId, nickname, participantCount }
    console.log('User left room:', data);

    // 参加者数を更新
    useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);

    emitLog({
      userId: validUserId(data.userId),
      userNickname: data.nickname,
      action: 'room-left',
      detail: { roomId: data.roomId, participantCount: data.participantCount }
    });
  };

  const handleRoomError = (data) => {
    // data: { error, roomId, message }
    console.error('Room error:', data);

    // エラーメッセージをユーザーに通知する仕組みを追加
    const errorMessage = {
      id: `error-${Date.now()}-${Math.random()}`,
      nickname: 'エラー',
      msg: `ルームエラー: ${data.message || data.error}`,
      roomId: data.roomId,
      isSystemMessage: true,
      isError: true,
      createdAt: new Date().toISOString()
    };

    addMessage(errorMessage, true);
  };

  const handleRoomList = (data) => {
    // data: { rooms: [{ id, name, description, participantCount }], spaceId, spaceInfo }
    console.log('Room list received:', data);

    if (data.rooms && Array.isArray(data.rooms)) {
      // スペース情報も含まれている場合は同時に更新
      if (data.spaceInfo) {
        console.log('🌍 [roomHandlers] スペース情報も同時更新:', data.spaceInfo);
        useRoomStore.getState().updateRoomsAndSpaceInfo(data.rooms, data.spaceInfo);
      } else {
        // ルーム一覧のみ更新（後方互換性）
        useRoomStore.getState().setRooms(data.rooms);
      }
    }
  };

  const handleRoomInfo = (data) => {
    // data: { roomId, roomInfo: { name, description, participantCount, participants } }
    console.log('Room info received:', data);

    if (data.roomInfo) {
      // 特定のルームの情報を更新
      const currentRooms = useRoomStore.getState().rooms;
      const updatedRooms = currentRooms.map(room =>
        room.id === data.roomId ? { ...room, ...data.roomInfo } : room
      );
      useRoomStore.getState().setRooms(updatedRooms);
    }
  };

  const handleRoomHistory = (data) => {
    // data: { roomId, messages: [...], startTime? }
    const endTime = performance.now();
    const loadTime = data.startTime ? endTime - data.startTime : 0;

    console.log(`📚 [useSocket] ${data.roomId}の履歴を受信:`, data.messages.length, '件');
    if (loadTime > 0) {
      console.log(`⏱️ [useSocket] 履歴読み込み時間: ${loadTime.toFixed(2)}ms`);
    }

    if (data.roomId && data.messages && Array.isArray(data.messages)) {
      // ルームストアに履歴を設定
      getRoomMessages(data.roomId, data.messages);

      // 現在のアクティブルームの履歴の場合、postStoreにも追加
      const currentRoomId = useRoomStore.getState().activeRoomId;
      if (data.roomId === currentRoomId) {
        data.messages.forEach((msg) => {
          addMessage(msg, false); // 履歴データなのでfalse
        });
      }

      // パフォーマンスログ
      const userInfo = useAppStore.getState().userInfo;
      emitLog({
        userId: validUserId(userInfo?._id),
        userNickname: userInfo?.nickname,
        action: 'room-history-loaded',
        detail: {
          roomId: data.roomId,
          messageCount: data.messages.length,
          loadTimeMs: loadTime
        }
      });
    }
  };

  return {
    handleRoomJoined,
    handleRoomLeft,
    handleUserJoined,
    handleUserLeft,
    handleRoomError,
    handleRoomList,
    handleRoomInfo,
    handleRoomHistory
  };
};
