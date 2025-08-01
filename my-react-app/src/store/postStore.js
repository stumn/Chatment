import { create } from 'zustand';

// 投稿（チャット・ドキュメント共通）ストア
const usePostStore = create((set, get) => ({
    posts: [], // 全投稿（サーバのPostコレクションと同じ）
    
    // ロックされた行の状態管理
    lockedRows: new Map(), // rowElementId -> { nickname, userId, postId }
    
    // 変更状態を管理するためのマップ
    changeStates: new Map(), // postId -> { type: 'added'|'modified'|'deleted'|'reordered', timestamp: Date, userNickname: string }

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

    // サーバから全件取得してセット（サーバ側の順序を保持）
    setPosts: (posts) =>
        set({
            posts: [...posts],
        }),

    // 1件追加（仮IDは使わず、サーバ返却値のみ）
    addPost: (post, isNewlyCreated = false) =>
        set((state) => {
            console.log('addPost called:', { post, isNewlyCreated });
            
            // ❌ 問題: IDの重複チェックはされていますが、サーバーからの重複データが
            // 多数送信された場合のパフォーマンスが悪い可能性があります
            // ✅ 修正案: Map を使用してO(1)での重複チェックを行う
            if (state.posts.some(m => m.id === post.id)) {
                console.log('Duplicate post ID detected, ignoring:', post.id);
                return { posts: state.posts };
            }
            
            // 新規作成の場合のみ変更状態を記録
            const newChangeStates = new Map(state.changeStates);
            if (isNewlyCreated) {
                console.log('Processing newly created post for change state');

                // isNewlyCreated=trueの場合は必ず変更状態を記録
                // タイムスタンプチェックは参考程度にし、新規作成フラグを優先
                let shouldAddChangeState = true;
                
                // タイムスタンプがある場合のみチェック（オプション）
                if (post.createdAt || post.timestamp) {
                    const postCreatedAt = new Date(post.createdAt || post.timestamp);
                    const now = new Date();
                    const timeDiffSeconds = (now - postCreatedAt) / 1000;
                    
                    console.log('Time diff check:', { postCreatedAt, now, timeDiffSeconds });
                    
                    // 極端に古い場合（1分以上）のみ除外
                    if (timeDiffSeconds > 60) {
                        shouldAddChangeState = false;
                        console.log('Post too old (>60s), not adding change state');
                    }
                } else {
                    console.log('No timestamp found, but isNewlyCreated=true, adding change state');
                }
                
                if (shouldAddChangeState) {
                    console.log('Adding change state for newly created post');
                    newChangeStates.set(post.id, {
                        type: 'added',
                        timestamp: new Date(),
                        userNickname: post.nickname || 'Unknown'
                    });
                }
            } else {
                console.log('Not newly created, skipping change state');
            }
            
            return { 
                posts: [...state.posts, post].sort((a, b) => a.displayOrder - b.displayOrder),
                changeStates: newChangeStates
            };
        }),

    // 編集
    updatePost: (id, newMsg, nickname, updatedAt) =>
        set((state) => {
            const existingPost = state.posts.find(m => m.id === id);
            if (!existingPost) return { posts: state.posts };
            
            // 編集の場合の変更状態を記録（内容が実際に変わった場合のみ）
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

    // 並び替え（DnDやチャット用order再採番）
    reorderPost: (posts) =>
        set((state) => {
            // バグ対策 - 並び替えは実行者のみに変更状態を記録（事前に記録済み）
            // ここでは状態の記録は行わず、投稿の順序のみ更新
            return {
                posts: [...posts]
            };
        }),

    // チャット用: 最新N件をupdatedAt順で取得（ルーム別対応）
    getChatMessages: (count = 10, roomId = null) => {
        const sorted = [...get().posts]
            .filter(post => {
                // 空メッセージ除外
                if (!post.msg || post.msg.trim() === "") return false;
                
                // ルーム指定がある場合はルームでフィルタリング
                if (roomId) {
                    return post.roomId === roomId;
                }
                
                // ルーム指定がない場合は、roomId がない投稿のみ表示
                return !post.roomId;
            })
            .sort((a, b) => {
                const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
                return aTime - bTime;
            });
        return sorted.slice(-count);
    },

    // ルーム用: 特定ルームのメッセージのみ取得
    getRoomMessages: (roomId) => {
        return [...get().posts]
            .filter(post => post.roomId === roomId)
            .sort((a, b) => {
                const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
                return aTime - bTime;
            });
    },

    // ルーム切り替え用: 表示中メッセージをクリアして新しいルームのメッセージを設定
    switchToRoom: (roomId) => set((state) => {
        // 現在表示中のメッセージをすべてクリア
        // 新しいルームのメッセージは handleRoomHistory で追加される
        console.log(`🔄 [postStore] ルーム切り替え: ${roomId}`);
        return {
            posts: state.posts.filter(post => post.roomId === roomId || !post.roomId)
        };
    }),

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
}));

export default usePostStore;
