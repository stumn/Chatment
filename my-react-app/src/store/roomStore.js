import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
    // 現在アクティブなルームID
    activeRoomId: 'room-1', // デフォルトでルーム1を選択

    // ルーム一覧データ
    rooms: [
        {
            id: 'room-1',
            name: '発表関連',
            participantCount: 5,
            description: '議論をしよう'
        },
        {
            id: 'room-2',
            name: 'general',
            participantCount: 3,
            description: '全員へのアナウンス'
        },
        {
            id: 'room-3',
            name: 'random',
            participantCount: 8,
            description: 'つぶやきを投下するところ'
        },
        {
            id: 'room-4',
            name: '雑談',
            participantCount: 2,
            description: 'とにかく雑談しよう'
        }
    ],

    // ルームごとのメッセージ履歴（メモリキャッシュ）
    roomMessages: {
        'room-1': [],
        'room-2': [],
        'room-3': [],
        'room-4': []
    },

    // ルーム履歴読み込み状態（最適化用）
    roomHistoryLoaded: {
        'room-1': false,
        'room-2': false,
        'room-3': false,
        'room-4': false
    },

    // ルーム切り替え中の状態
    switchingRoom: false,
    
    // ルーム履歴の読み込みを開始/完了
    setRoomHistoryLoaded: (roomId, loaded) => {
        console.log(`📚 [roomStore] ${roomId}の履歴読み込み状態: ${loaded}`);
        set((state) => ({
            roomHistoryLoaded: {
                ...state.roomHistoryLoaded,
                [roomId]: loaded
            }
        }));
    },

    // ルーム切り替え中の状態を設定
    setSwitchingRoom: (switching) => {
        console.log(`🔄 [roomStore] ルーム切り替え中: ${switching}`);
        set({ switchingRoom: switching });
    },

    // アクティブなルームを変更する
    setActiveRoom: (roomId) => {
        console.log(`🏠 [roomStore] アクティブルーム変更: ${roomId}`);
        set({ activeRoomId: roomId });
    },

    // ルーム一覧を更新する
    setRooms: (rooms) => {
        console.log('🏠 [roomStore] ルーム一覧更新:', rooms);
        set({ rooms });
    },

    // 特定のルームの参加者数を更新する
    updateRoomParticipantCount: (roomId, count) => {
        console.log(`🏠 [roomStore] ${roomId}の参加者数更新: ${count}人`);
        set((state) => ({
            rooms: state.rooms.map(room =>
                room.id === roomId ? { ...room, participantCount: count } : room
            )
        }));
    },

    // ルームにメッセージを追加する（キャッシュ機能付き）
    addMessageToRoom: (roomId, message) => {
        console.log(`💬 [roomStore] ${roomId}にメッセージ追加:`, message);
        set((state) => ({
            roomMessages: {
                ...state.roomMessages,
                [roomId]: [...(state.roomMessages[roomId] || []), message]
            }
        }));
    },

    // ルームのメッセージ履歴をクリア
    clearRoomMessages: (roomId) => {
        console.log(`🗑️ [roomStore] ${roomId}のメッセージ履歴をクリア`);
        set((state) => ({
            roomMessages: {
                ...state.roomMessages,
                [roomId]: []
            },
            roomHistoryLoaded: {
                ...state.roomHistoryLoaded,
                [roomId]: false
            }
        }));
    },

    // ルームのメッセージ履歴を設定（一括設定）
    setRoomMessages: (roomId, messages) => {
        console.log(`📋 [roomStore] ${roomId}のメッセージ履歴を設定:`, messages.length, '件');
        set((state) => ({
            roomMessages: {
                ...state.roomMessages,
                [roomId]: messages
            }
        }));
    },

    // 特定ルームのメッセージを取得
    getRoomMessages: (roomId) => {
        const state = get();
        return state.roomMessages[roomId] || [];
    },

    // ルーム履歴が読み込み済みかチェック
    isRoomHistoryLoaded: (roomId) => {
        const state = get();
        return state.roomHistoryLoaded[roomId] || false;
    }
}));

export default useRoomStore;