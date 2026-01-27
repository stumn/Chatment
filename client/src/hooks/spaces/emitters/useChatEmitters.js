import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useChatEmitters = (socket, emitLog) => {
  const emitChatMessage = (nickname, message, userId, roomId = null, pollData = null) => {
    const { userInfo } = useAppStore.getState();

    const messageData = {
      nickname,
      message,
      userId,
      spaceId: userInfo.spaceId,
      ...(roomId && { roomId }), // roomIdがある場合のみ追加
      ...(pollData && { poll: pollData }) // アンケートデータがある場合のみ追加
    };

    console.log('Emitting chat message:', messageData);
    socket.emit('chat-message', messageData);

    emitLog({
      userId: validUserId(userId),
      action: 'chat-message',
      detail: { nickname, message, roomId, spaceId: userInfo.spaceId, isPoll: !!pollData }
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

  const emitPollVote = (postId, optionIndex) => {
    const { userInfo } = useAppStore.getState();
    if (!postId || optionIndex === undefined || !userInfo) return;

    socket.emit('poll-vote', {
      postId,
      optionIndex,
      userId: userInfo._id || userInfo.id,
      nickname: userInfo.nickname,
      roomId: userInfo.roomId,
      spaceId: userInfo.spaceId
    });

    emitLog({
      userId: validUserId(userInfo._id),
      action: 'poll-vote',
      detail: { postId, optionIndex, nickname: userInfo.nickname }
    });
  };

  return {
    emitChatMessage,
    emitPositive,
    emitNegative,
    emitPollVote
  };
};
