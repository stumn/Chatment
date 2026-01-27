import usePostStore from '../../../store/spaces/postStore';
import useRoomStore from '../../../store/spaces/roomStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useChatHandlers = (emitLog) => {
  const addMessage = usePostStore((state) => state.addPost);

  const handleChatMessage = (data) => {
    console.log('handleChatMessage: ', data);

    // ルームメッセージの場合、現在のアクティブルームと一致するかチェック
    if (data.roomId) {
      const currentRoomId = useRoomStore.getState().activeRoomId;

      // 現在のルームと異なる場合は表示しない
      if (data.roomId !== currentRoomId) { return; }

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

  const handlePollUpdate = (data) => {
    // アンケート結果の更新を処理
    const { id, poll } = data;

    // 該当する投稿を見つけて更新
    const posts = usePostStore.getState().posts;
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex !== -1) {
      const updatedPost = { ...posts[postIndex], poll };
      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      usePostStore.setState({ posts: newPosts });
    }
  };

  const handlePollError = (data) => {
    console.error('Poll error:', data.message);
    // エラーをユーザーに表示する処理を追加可能
  };

  return {
    handleChatMessage,
    handlePositive,
    handleNegative,
    handlePollUpdate,
    handlePollError
  };
};
