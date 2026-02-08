import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useChatEmitters = (socket, emitLog) => {
  const emitChatMessage = (handleName, message, userId) => {
    const { userInfo } = useAppStore.getState();

    // displayName（選択された表示名）のみを送信
    // nickname, userId, spaceIdはサーバー側のsocketから取得される
    const messageData = {
      displayName: handleName, // 選択された表示名
      message
    };

    socket.emit('chat-message', messageData);

    emitLog({
      userId: validUserId(userId),
      action: 'chat-message',
      detail: { handleName, message }
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
