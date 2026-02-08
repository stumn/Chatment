import usePostStore from '../../../store/spaces/postStore';

export const useChatHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);

  const handleChatMessage = (data) => {
    // チャットメッセージとして追加（新規作成として扱う）
    addMessage(data, true);
  };

  const handlePositive = (data) => {
    usePostStore.getState().updatePositive(data.id, data.positive, data.userHasVotedPositive);
  };

  const handleNegative = (data) => {
    usePostStore.getState().updateNegative(data.id, data.negative, data.userHasVotedNegative);
  };

  return {
    handleChatMessage,
    handlePositive,
    handleNegative
  };
};
