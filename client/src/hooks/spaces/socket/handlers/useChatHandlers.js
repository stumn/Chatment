import usePostStore from '../../../../store/spaces/postStore';
import useRoomStore from '../../../../store/spaces/roomStore';
import { validUserId } from '../utils/socketUtils';

export const useChatHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);

  const handleChatMessage = (data) => {
    console.log(`📥 [useChatHandlers] チャットメッセージ受信:`, {
      hasRoomId: !!data.roomId,
      roomId: data.roomId,
      messagePreview: data.message?.substring(0, 50)
    });

    // ルームメッセージの場合、現在のアクティブルームと一致するかチェック
    if (data.roomId) {
      const currentRoomId = useRoomStore.getState().activeRoomId;
      console.log(`🏠 [useSocket] ルームメッセージ受信 - 送信先: ${data.roomId}, 現在のルーム: ${currentRoomId}`);

      if (data.roomId !== currentRoomId) {
        console.log('🚫 [useSocket] 異なるルームのメッセージのため無視');
        return; // 現在のルームと異なる場合は表示しない
      }

      // ルーム別メッセージ履歴に保存
      usePostStore.getState().addPost(data, true, data.roomId);
    }

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
