import { create } from 'zustand';

const useChatStore = create((set) => ({
  // チャットメッセージの一覧
  messages: [],

  // メッセージの追加　id 自動生成
  addMessage: (post) =>
    set((state) => {
      const nickname = post.nickname || 'Unknown';
      const message = post.msg || '';
      const fav = typeof post.fav === 'number' ? post.fav : (typeof post.count === 'number' ? post.count : 0);
      const newId = post.id || (state.messages.length + 1);
      const newOrder = state.messages[state.messages.length - 1]?.order + 1 || 1;
      const newTime = post.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      // --- positive/negative人数・自分が押したかも反映 ---
      return {
        messages: [
          ...state.messages,
          {
            id: newId,
            order: newOrder,
            nickname: nickname,
            msg: message,
            time: newTime,
            fav: fav,
            positive: post.positive || 0,
            negative: post.negative || 0,
            isPositive: post.isPositive || false,
            isNegative: post.isNegative || false,
          },
        ],
      };
    }),

  customAddMessage: ({ nickname, msg, order }) =>
    set((state) => {
      const newId = state.messages.length + 1;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const initialFav = 0;

      // 新しいメッセージを作成
      const newMessage = {
        id: newId,
        order: order,
        nickname: nickname || 'Unknown',
        msg: msg || '',
        time: newTime,
        fav: initialFav,
      };

      // order が既に存在するかチェック
      const orderExists = state.messages.some(m => m.order === order);

      let updatedMessages;
      if (orderExists) {
        // order で昇順ソート
        updatedMessages = state.messages
          .map(m => {
            // 既存 order が新規 order 以上なら order を1つ増やす
            if (m.order >= order) {
              return { ...m, order: m.order + 1 };
            }
            return m;
          })
          .concat(newMessage)
          .sort((a, b) => a.order - b.order);
      } else {
        updatedMessages = [...state.messages, newMessage].sort((a, b) => a.order - b.order);
      }

      return {
        messages: updatedMessages,
      };
    }),

  // 指定したindex のメッセージを編集
  updateMessage: (index, newMsg) =>
    set((state) => {
      const updatedMessages = [...state.messages];
      if (index >= 0 && index < updatedMessages.length) {
        updatedMessages[index] = {
          ...updatedMessages[index],
          msg: newMsg, // msg プロパティを更新
        };
      } else {
        console.warn(`Invalid index: ${index}`);
      }
      return { messages: updatedMessages };
    }),

  reorderMessages: (fromIndex, toIndex) => set((state) => {
    const updated = [...state.messages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return { messages: updated };
  }),

  // --- サーバfavイベントでidとfavのみが来る場合にも対応 ---
  updateFav: (id, fav) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, fav } : msg
    ),
  })),

  // --- サーバpositiveイベントでid, positive, isPositiveを受けて更新 ---
  updatePositive: (id, positive, isPositive) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, positive, isPositive } : msg
    ),
  })),
  // --- サーバnegativeイベントでid, negative, isNegativeを受けて更新 ---
  updateNegative: (id, negative, isNegative) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, negative, isNegative } : msg
    ),
  })),
}));

export default useChatStore;
