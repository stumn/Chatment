import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
    // 現在アクティブなルームID
    activeRoomId: 'room-1', // デフォルトでルーム1を選択

    // ルーム一覧データ
    rooms: [
        {
            id: 'room-1',
            name: 'ゲーム雑談',
            participantCount: 5,
            description: 'ゲームについて話す部屋'
        },
        {
            id: 'room-2',
            name: '技術討論',
            participantCount: 3,
            description: 'プログラミングや技術の話'
        },
        {
            id: 'room-3',
            name: '雑談ルーム',
            participantCount: 8,
            description: '何でも話せる部屋'
        },
        {
            id: 'room-4',
            name: 'アニメ・漫画',
            participantCount: 2,
            description: 'アニメや漫画の話題'
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
    setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

    // ルーム一覧を更新する
    setRooms: (rooms) => set({ rooms }),

    // 特定のルームの参加者数を更新する
    updateRoomParticipantCount: (roomId, count) => set((state) => ({
        rooms: state.rooms.map(room =>
            room.id === roomId ? { ...room, participantCount: count } : room
        )
    })),

    // ルームにメッセージを追加する（将来の実装用）
    addMessageToRoom: (roomId, message) => set((state) => ({
        roomMessages: {
            ...state.roomMessages,
            [roomId]: [...(state.roomMessages[roomId] || []), message]
        }
    }))
}));

export default useRoomStore;