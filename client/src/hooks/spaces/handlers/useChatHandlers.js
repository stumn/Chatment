import usePostStore from '../../../store/spaces/postStore';
import useRoomStore from '../../../store/spaces/roomStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useChatHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);

  const handleChatMessage = (data) => {

    // ルームメッセージの場合、現在のアクティブルームと一致するかチェック
    if (data.roomId) {
      const currentRoomId = useRoomStore.getState().activeRoomId;

      if (data.roomId !== currentRoomId) {
        return; // 現在のルームと異なる場合は表示しない
      }

      // ルーム別メッセージ履歴に保存
      usePostStore.getState().addPost(data, true, data.roomId);
    }

    // チャットメッセージとして追加（新規作成として扱う）
    addMessage(data, true, data.roomId);
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
