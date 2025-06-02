import { create } from 'zustand';

const useChatStore = create((set) => ({
  // チャットメッセージの一覧
  messages: [],

  // メッセージの追加　id 自動生成
  addMessage: (name, message) =>
    set((state) => {
      const newId = state.messages.length + 1;
      const newOrder = state.messages[state.messages.length - 1]?.order + 1 || 1;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // 現在の時刻を取得
      const initialFav = 0; // 初期値は0

      // console.log(newId, newOrder, name, message, newTime, initialFav);
      return {
        messages: [
          ...state.messages,
          {
            id: newId,
            order: newOrder,
            name: name,
            msg: message,
            time: newTime,
            fav: initialFav,
          },
        ],
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
}));

export default useChatStore;
