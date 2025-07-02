import { create } from 'zustand';

// 投稿（チャット・ドキュメント共通）ストア
const usePostStore = create((set, get) => ({
    posts: [], // 全投稿（サーバのPostコレクションと同じ）

    // サーバから全件取得してセット（サーバ側の順序を保持）
    setPosts: (posts) =>
        set({
            posts: [...posts],
        }),

    // 1件追加（仮IDは使わず、サーバ返却値のみ）
    addPost: (post) =>
        set((state) => {
            if (state.posts.some(m => m.id === post.id)) return { posts: state.posts };
            return { posts: [...state.posts, post].sort((a, b) => a.displayOrder - b.displayOrder) };
        }),

    // 編集
    updatePost: (id, newMsg) =>
        set((state) => ({
            posts: state.posts.map((m) =>
                m.id === id ? { ...m, msg: newMsg } : m
            ),
        })),

    // 並び替え（DnDやチャット用order再採番）
    reorderPost: (posts) =>
        set({
            posts: [...posts],
        }),

    // チャット用: 最新N件をcreatedAt順で取得
    getChatMessages: (count = 10) => {
        const sorted = [...get().posts]
            .filter(post => post.msg && post.msg.trim() !== "") // 空メッセージ除外
            .sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aTime - bTime;
            });
        return sorted.slice(-count);
    },

    // ドキュメント用: displayOrder順で全件取得
    getDocMessages: () => {
        return [...get().posts].sort((a, b) => a.displayOrder - b.displayOrder);
    },

    // Positive/Negative
    updatePositive: (id, positive, isPositive) => set((state) => ({
        posts: state.posts.map((msg) =>
            (msg.id === id || msg.id === String(id)) ? { ...msg, positive, isPositive } : msg
        ),
    })),
    updateNegative: (id, negative, isNegative) => set((state) => ({
        posts: state.posts.map((msg) =>
            (msg.id === id || msg.id === String(id)) ? { ...msg, negative, isNegative } : msg
        ),
    })),
}));

export default usePostStore;
