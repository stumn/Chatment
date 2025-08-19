import useAppStore from '../../../store/appStore';
import { validUserId } from '../utils/socketUtils';

export const useChatEmitters = (socket, emitLog) => {
  const emitChatMessage = (nickname, message, userId, roomId = null) => {
    const messageData = {
      nickname,
      message,
      userId,
      ...(roomId && { roomId }) // roomIdがある場合のみ追加
    };

    socket.emit('chat-message', messageData);

    emitLog({
      userId: validUserId(userId),
      action: 'chat-message',
      detail: { nickname, message, roomId }
    });
  };

  const emitPositive = (id) => {
    const { userInfo } = useAppStore.getState();
    if (!id || !userInfo.nickname) return;
    
    socket.emit('positive', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'positive',
      detail: { postId: id, nickname: userInfo.nickname }
    });
  };

  const emitNegative = (id) => {
    const { userInfo } = useAppStore.getState();
    if (!id || !userInfo.nickname) return;
    
    socket.emit('negative', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'negative',
      detail: { postId: id, nickname: userInfo.nickname }
    });
  };

  return {
    emitChatMessage,
    emitPositive,
    emitNegative
  };
};
