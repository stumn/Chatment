import { create } from 'zustand';

// ドキュメント用store（displayOrderベース）
const useDocStore = create((set, get) => ({
    docMessages: [],

    // サーバから全件取得してセット（displayOrder順ソート）
    setDocMessages: (messages) =>
        set({
            docMessages: [...messages].sort((a, b) => a.displayOrder - b.displayOrder),
        }),

    // サーバから新規チャットを取得してセット
    addDocMessages: (messages) =>
        set((state) => {
            const newList = [...state.docMessages, ...messages].sort((a, b) => a.displayOrder - b.displayOrder);
            return { docMessages: newList };
        }),

    // 新規行追加（displayOrderを指定して追加）
    addDocMessage: (msgObj) =>
        set((state) => {
            const newList = [...state.docMessages, msgObj].sort((a, b) => a.displayOrder - b.displayOrder);
            return { docMessages: newList };
        }),

    // 行編集
    updateDocMessage: (id, newMsg) =>
        set((state) => ({
            docMessages: state.docMessages.map((m) =>
                m.id === id ? { ...m, msg: newMsg } : m
            ),
        })),

    // 並び替え（DnD後に新しいdisplayOrderで更新）
    reorderDocMessages: (id, newDisplayOrder) =>
        set((state) => ({
            docMessages: state.docMessages.map((m) =>
                m.id === id ? { ...m, displayOrder: newDisplayOrder } : m
            ).sort((a, b) => a.displayOrder - b.displayOrder),
        })),

    // TODO: docMessagesのid, displayOrder, userId等の構造がサーバ返却値と一致しているか要確認
}));

export default useDocStore;
