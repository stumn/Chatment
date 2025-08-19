import { create } from 'zustand';
const DEFAULT_ROOM_ID = 'room-0'; // デフォルトのルームID

const useRoomStore = create((set, get) => ({
    // 現在アクティブなルームID
    activeRoomId: DEFAULT_ROOM_ID,

    // ルーム一覧データ
    rooms: [],

    // ルームごとのメッセージ履歴（メモリキャッシュ）
    roomMessages: {},

    // ルーム履歴読み込み状態（最適化用）
    roomHistoryLoaded: {
        'room-0': false,
        'room-1': false,
        'room-2': false,
        'room-3': false,
        'room-4': false,
    },

    // ルーム切り替え中の状態
    switchingRoom: false,

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

    // ルーム履歴が読み込み済みかチェック
    isRoomHistoryLoaded: (roomId) => {
        const state = get();
        return state.roomHistoryLoaded[roomId] || false;
    }
}));

export default useRoomStore;