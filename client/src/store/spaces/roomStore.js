import { create } from 'zustand';
const DEFAULT_ROOM_ID = 'space0-main'; // デフォルトのルームID

const useRoomStore = create((set, get) => ({
    // 現在アクティブなルームID
    activeRoomId: DEFAULT_ROOM_ID,

    // ルーム一覧データ
    rooms: [],

    // 現在のスペース情報（サブルーム設定含む）
    currentSpaceInfo: null,

    // サブルーム設定
    subRoomSettings: null,

    // ルームごとのメッセージ履歴（メモリキャッシュ）
    roomMessages: {},

    // ルーム履歴読み込み状態（最適化用）
    roomHistoryLoaded: {
        'space0-main': false,
        'space0-room1': false,
        'space0-room2': false,
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

    // 現在のスペース情報を設定
    setCurrentSpaceInfo: (spaceInfo) => {
        console.log('🌍 [roomStore] スペース情報更新:', spaceInfo);
        set({ 
            currentSpaceInfo: spaceInfo,
            subRoomSettings: spaceInfo?.settings?.subRoomSettings || null
        });
    },

    // サブルーム設定を更新
    setSubRoomSettings: (settings) => {
        console.log('🔧 [roomStore] サブルーム設定更新:', settings);
        set({ subRoomSettings: settings });
    },

    // ルーム一覧とスペース情報を同時に更新
    updateRoomsAndSpaceInfo: (rooms, spaceInfo) => {
        console.log('🔄 [roomStore] ルーム一覧とスペース情報を同時更新');
        set({ 
            rooms,
            currentSpaceInfo: spaceInfo,
            subRoomSettings: spaceInfo?.settings?.subRoomSettings || null
        });
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
    },

    // サブルーム表示が必要かを判定
    shouldShowSubRoomList: () => {
        const { subRoomSettings, rooms } = get();
        return subRoomSettings?.enabled && rooms.length > 1;
    },

    // 現在のスペースでサブルームが有効かを判定
    isSubRoomEnabled: () => {
        const { subRoomSettings } = get();
        return subRoomSettings?.enabled || false;
    },

    // デフォルトルーム（全体）のIDを取得
    getDefaultRoomId: () => {
        const { currentSpaceInfo } = get();
        const spaceId = currentSpaceInfo?.id || 0;
        return `space${spaceId}-main`;
    }
}));

export default useRoomStore;