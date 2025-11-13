import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
    // 現在アクティブなルームID（サブルーム廃止により常に"全体"ルーム）
    // 初期値はnull、ルーム参加時に設定される
    activeRoomId: null,

    // ルーム一覧データ（サブルーム廃止により常に1つのみ）
    rooms: [],

    // 現在のスペース情報
    currentSpaceInfo: null,

    // ルームごとのメッセージ履歴（メモリキャッシュ）
    roomMessages: {},

    // ルーム履歴読み込み状態（最適化用）
    roomHistoryLoaded: {},

    // アクティブなルームを変更する
    setActiveRoom: (roomId) => {
        set({ activeRoomId: roomId });
    },

    // ルーム一覧を更新する
    setRooms: (rooms) => {
        set({ rooms });
    },

    // 現在のスペース情報を設定
    setCurrentSpaceInfo: (spaceInfo) => {
        set({
            currentSpaceInfo: spaceInfo
        });
    },

    // ルーム一覧とスペース情報を同時に更新
    updateRoomsAndSpaceInfo: (rooms, spaceInfo) => {
        console.log('🔄 [roomStore] ルーム一覧とスペース情報を同時更新');
        set({
            rooms,
            currentSpaceInfo: spaceInfo
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

    // デフォルトルーム（全体）のIDを取得
    getDefaultRoomId: () => {
        const { currentSpaceInfo } = get();
        const spaceId = currentSpaceInfo?.id || 0;
        return `space${spaceId}-main`;
    }
}));

export default useRoomStore;