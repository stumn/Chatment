import useAppStore from '../../../store/spaces/appStore';
import useRoomStore from '../../../store/spaces/roomStore';
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
    const { activeRoomId } = useRoomStore.getState();

    if (!postId || optionIndex === undefined || !userInfo) {
      return;
    }

    const voteData = {
      postId,
      optionIndex,
      userId: userInfo.userId,
      nickname: userInfo.nickname,
      roomId: activeRoomId,
      spaceId: userInfo.spaceId
    };

    socket.emit('poll-vote', voteData);

    emitLog({
      userId: validUserId(userInfo.userId),
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
