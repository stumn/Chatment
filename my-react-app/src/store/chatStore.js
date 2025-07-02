import { create } from 'zustand';

const useChatStore = create((set) => ({
  // チャットメッセージの一覧
  messages: [],

  // メッセージの追加
  addMessage: (post) =>
    set((state) => {
      const nickname = post.nickname || 'Unknown';
      const message = post.msg || '';
      const newId = post.id || (state.messages.length + 1);
      // --- 既に同じidのメッセージが存在する場合は追加しない ---
      if (state.messages.some(m => m.id === newId)) {
        return { messages: state.messages };
      }
      const newOrder = state.messages[state.messages.length - 1]?.order + 1 || 1;
      const newTime = post.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      // --- fav関連のプロパティは削除 ---
      return {
        messages: [
          ...state.messages,
          {
            id: newId,
            order: newOrder,
            nickname: nickname,
            msg: message,
            time: newTime,
            positive: post.positive || 0,
            negative: post.negative || 0,
            isPositive: post.isPositive || false,
            isNegative: post.isNegative || false,
          },
        ],
      };
    }),

  customAddMessage: ({ nickname, msg, index }) =>
    set((state) => {
      const newId = state.messages.length + 1;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newMessage = {
        id: newId,
        nickname: nickname || 'Unknown',
        msg: msg || '',
        time: newTime,
        positive: 0,
        negative: 0,
        isPositive: false,
        isNegative: false,
      };
      // indexの直後に新規行を挿入
      const updatedMessages = [...state.messages];
      updatedMessages.splice(index + 1, 0, newMessage);
      // orderをindex順に再採番
      const messagesWithOrder = updatedMessages.map((m, i) => ({ ...m, order: i + 1 }));
      return {
        messages: messagesWithOrder,
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

  // --- positive/negativeイベントのactionはそのまま ---
  updatePositive: (id, positive, isPositive) => set((state) => ({
    messages: state.messages.map((msg) =>
      (msg.id === id || msg.id === String(id)) ? { ...msg, positive, isPositive } : msg
    ),
  })),
  updateNegative: (id, negative, isNegative) => set((state) => ({
    messages: state.messages.map((msg) =>
      (msg.id === id || msg.id === String(id)) ? { ...msg, negative, isNegative } : msg
    ),
  })),
}));

export default useChatStore;
