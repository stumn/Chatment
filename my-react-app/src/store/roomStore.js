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
            description: '発表に関連した議論をしよう'
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
            description: 'プライベートなTwitter'
        },
        {
            id: 'room-4',
            name: '雑談',
            participantCount: 2,
            description: 'とにかく雑談しよう'
        }
    ],

    // ルームごとのメッセージ履歴（将来のために準備）
    roomMessages: {
        'room-1': [],
        'room-2': [],
        'room-3': [],
        'room-4': []
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

    // ルームにメッセージを追加する（将来の実装用）
    addMessageToRoom: (roomId, message) => {
        console.log(`💬 [roomStore] ${roomId}にメッセージ追加:`, message);
        set((state) => ({
            roomMessages: {
                ...state.roomMessages,
                [roomId]: [...(state.roomMessages[roomId] || []), message]
            }
        }));
    }
}));

export default useRoomStore;