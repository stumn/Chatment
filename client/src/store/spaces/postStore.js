// 投稿に関連するストア
import { create } from 'zustand';
import useAppStore from './appStore';

const usePostStore = create((set, get) => ({

    // ----- 全投稿（サーバのPostコレクションと同じになるよう管理） -----
    posts: [],

    //　history, docs用: 全件取得
    setPosts: (posts) => set({ posts: [...posts], }),

    // 1件追加（仮IDは使わず、サーバ返却値のみ） roomId指定可能
    addPost: (post, isNewlyCreated = false, roomId) =>
        set((state) => {
            // 🚫デバッグログ
            // const spaceName = useAppStore.getState().spaceName || '(未設定)';
            // const targetRoomId = roomId || '(ルーム未指定)';
            // console.log(`💬 [postStore] ${spaceName} ${targetRoomId}にメッセージ追加:`, post);

            // 受け取ったpostはサーバーからの完全なデータであることを前提とする
            // post.idが存在しない場合はエラー
            if (!post.id) {
                console.error('Invalid post data received:', post);
                return { posts: state.posts };
            }

            // IDの重複チェック
            const postIdMap = new Map(state.posts.map(p => [p.id, true]));
            if (postIdMap.has(post.id)) { return { posts: state.posts }; }

            // roomIdが指定されている場合は、postにroomIdを設定
            const postWithRoom = roomId ? { ...post, roomId } : post;

            // 新規作成の場合のみ変更状態を記録
            let newChangeStates = new Map(state.changeStates);
            newChangeStates = addChangeStateIfNeeded(newChangeStates, postWithRoom, isNewlyCreated);

            return {
                posts: [...state.posts, postWithRoom].sort((a, b) => a.displayOrder - b.displayOrder),
                changeStates: newChangeStates
            };
        }),

    // 更新
    updatePost: (id, newMsg, nickname, updatedAt) =>
        set((state) => {

            // IDが指定されていない場合はエラー
            const existingPost = state.posts.find(m => m.id === id);
            if (!existingPost) return { posts: state.posts };

            // 更新の場合の変更状態を記録（内容が実際に変わった場合のみ）
            const newChangeStates = new Map(state.changeStates);
            if (newMsg !== undefined && newMsg !== existingPost.msg) {
                newChangeStates.set(id, {
                    type: 'modified',
                    timestamp: new Date(),
                    userNickname: nickname || existingPost.nickname || 'Unknown'
                });
            }

            return {
                posts: state.posts.map((m) =>
                    m.id === id
                        ? {
                            ...m,
                            msg: newMsg !== undefined ? newMsg : m.msg,
                            ...(nickname ? { nickname } : {}),
                            ...(updatedAt ? { updatedAt } : {})
                        }
                        : m
                ),
                changeStates: newChangeStates
            };
        }),

    // 並び替え
    reorderPost: (posts) =>
        set((state) => {
            return {
                posts: [...posts]
            };
        }),

    // 行削除（id指定）
    removePost: (id) => set((state) => {
        // 削除の場合の変更状態を記録
        const newChangeStates = new Map(state.changeStates);

        const deletedPost = state.posts.find(p => p.id === id);
        if (deletedPost) {
            newChangeStates.set(id, {
                type: 'deleted',
                timestamp: new Date(),
                userNickname: deletedPost.nickname || 'Unknown'
            });
        }

        return {
            posts: state.posts.filter((msg) => msg.id !== id),
            changeStates: newChangeStates
        };
    }),

    // ----- 特定ルームのメッセージのみ取得 -----
    getRoomMessages: (roomId) => {
        return [...get().posts]
            .filter(post => post.roomId === roomId)
            .sort((a, b) => {
                const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
                return aTime - bTime;
            });
    },

    // Positive
    updatePositive: (id, positive, userHasVotedPositive) => set((state) => ({
        posts: state.posts.map((msg) =>
            (msg.id === id || msg.id === String(id)) ? { ...msg, positive, userHasVotedPositive } : msg
        ),
    })),

    // Negative
    updateNegative: (id, negative, userHasVotedNegative) => set((state) => ({
        posts: state.posts.map((msg) =>
            (msg.id === id || msg.id === String(id)) ? { ...msg, negative, userHasVotedNegative } : msg
        ),
    })),

    // ----- ロックされた行の状態管理 -----
    lockedRows: new Map(), // rowElementId -> { nickname, userId, postId }

    // ロック状態の操作メソッド
    lockRow: (rowElementId, lockInfo) => set((state) => {
        const newLockedRows = new Map(state.lockedRows);
        newLockedRows.set(rowElementId, lockInfo);
        return { lockedRows: newLockedRows };
    }),

    unlockRow: (rowElementId) => set((state) => {
        const newLockedRows = new Map(state.lockedRows);
        newLockedRows.delete(rowElementId);
        return { lockedRows: newLockedRows };
    }),

    isRowLocked: (rowElementId) => {
        const state = get();
        return state.lockedRows.has(rowElementId);
    },

    getRowLockInfo: (rowElementId) => {
        const state = get();
        return state.lockedRows.get(rowElementId);
    },

    // ------ 変更状態を管理するためのマップ ------
    changeStates: new Map(), // postId -> { type: 'added'|'modified'|'deleted'|'reordered', timestamp: Date, userNickname: string }

    // 変更状態の操作メソッド
    setChangeState: (postId, changeType, userNickname) => set((state) => {
        const newChangeStates = new Map(state.changeStates);
        newChangeStates.set(postId, {
            type: changeType,
            timestamp: new Date(),
            userNickname: userNickname
        });
        return { changeStates: newChangeStates };
    }),

    clearChangeState: (postId) => set((state) => {
        const newChangeStates = new Map(state.changeStates);
        newChangeStates.delete(postId);
        return { changeStates: newChangeStates };
    }),

    getChangeState: (postId) => {
        const state = get();
        return state.changeStates.get(postId);
    },

    // 一定時間後に変更状態をクリアする
    clearOldChangeStates: (ageInMinutes = 5) => set((state) => {
        const now = new Date();
        const newChangeStates = new Map(state.changeStates);

        for (const [postId, changeState] of newChangeStates.entries()) {
            const timeDiff = (now - changeState.timestamp) / (1000 * 60); // 分単位
            if (timeDiff > ageInMinutes) {
                newChangeStates.delete(postId);
            }
        }

        return { changeStates: newChangeStates };
    }),

}));

export default usePostStore;

// 新規作成時の変更状態を追加するヘルパー関数
function addChangeStateIfNeeded(newChangeStates, post, isNewlyCreated = false) {

    // 新規作成ではない場合は変更状態を記録しない
    if (!isNewlyCreated) { return newChangeStates; }

    // isNewlyCreated=trueの場合は必ず変更状態を記録
    let shouldAddChangeState = true;

    // タイムスタンプがある場合は補助的にチェックを行う
    if (post.createdAt || post.timestamp) {
        const postCreatedAt = new Date(post.createdAt || post.timestamp);
        const now = new Date();
        const timeDiffSeconds = (now - postCreatedAt) / 1000;

        // 極端に古い場合（1分以上）のみ除外
        if (timeDiffSeconds > 60) {
            shouldAddChangeState = false;
            console.log('Post too old (>60s), not adding change state');
        }

    }

    // 変更状態を追加
    if (shouldAddChangeState) {
        newChangeStates.set(post.id, {
            type: 'added',
            timestamp: new Date(),
            userNickname: post.nickname || 'Unknown'
        });
    }

    return newChangeStates;
}
