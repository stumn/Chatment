// roomManagement.js
const { Room } = require('../db');
const { handleErrors } = require('../utils');

// --- アクティブなルーム一覧を取得 ---
async function getActiveRooms() {
    try {

        // 処理時間の計測開始（timeで開始 → timeEndで終了・結果出力）
        console.time('getActiveRooms');

        // アクティブなルームを取得（roomIdの昇順でソート）
        const rooms = await Room.find({ isActive: true }).sort({ id: 1 }).lean().exec();

        console.timeEnd('getActiveRooms');

        console.log(`🏠 [dbOperation] アクティブルーム取得: ${rooms.length}件`);

        return rooms;

    } catch (error) {
        handleErrors(error, 'アクティブルーム取得中にエラーが発生しました');
        return [];
    }
}

// --- ルーム情報を取得 ---
async function getRoomById(roomId) {
    try {
        // 受信したroomIdでRoomを取得
        const room = await Room.findOne({ id: roomId }).lean().exec();
        if (!room) {
            console.warn(`⚠️ [dbOperation] ルームが見つかりません: ${roomId}`);
            return null;
        }

        return room;

    } catch (error) {
        handleErrors(error, `ルーム情報取得中にエラーが発生しました: ${roomId}`);
        return null;
    }
}

// --- ルームの統計情報を更新 ---
async function updateRoomStats(roomId, updates = {}) {
    try {

        // 更新日時を設定
        const updateData = {
            lastActivity: new Date(),
            ...updates
        };

        // 更新処理を実行
        const updatedRoom = await Room.findOneAndUpdate(
            { id: roomId },
            { $set: updateData },
            { new: true, lean: true }
        );

        // 更新結果のログ出力
        if (updatedRoom) { console.log(`📊 [dbOperation] ルーム統計更新: ${roomId}`, updates); }

        return updatedRoom;

    } catch (error) {
        handleErrors(error, `ルーム統計更新中にエラーが発生しました: ${roomId}`);
        return null;
    }
}

// --- 新しいルームを作成 ---
async function createRoom(roomData) {
    try {
        // roomDataのデストラクション
        const { id, spaceId = 0, name, description, settings = {} } = roomData;

        // 重複チェック
        const existingRoom = await Room.findOne({ id });
        if (existingRoom) { throw new Error(`ルームID ${id} は既に存在します`); }

        // 新しいルームを作成
        const newRoom = await Room.create({
            id,
            spaceId, // スペースIDを追加
            name,
            description,
            settings: {
                autoDeleteMessages: settings.autoDeleteMessages || false,
                messageRetentionDays: settings.messageRetentionDays || 30,
                allowAnonymous: settings.allowAnonymous !== false // デフォルトはtrue
            }
        });

        console.log(`🏠 [dbOperation] 新しいルーム作成: ${name} (${id})`);

        return newRoom.toObject();

    } catch (error) {
        handleErrors(error, 'ルーム作成中にエラーが発生しました');
        return null;
    }
}

// --- スペース固有のアクティブなルーム一覧を取得 ---
async function getActiveRoomsBySpaceId(spaceId) {
    try {
        console.time('getActiveRoomsBySpaceId');

        // 指定されたスペースIDのアクティブなルームを取得（roomIdの昇順でソート）
        const rooms = await Room.find({ 
            isActive: true,
            spaceId: spaceId 
        }).sort({ id: 1 }).lean().exec();

        console.timeEnd('getActiveRoomsBySpaceId');

        console.log(`🏠 [dbOperation] スペース ${spaceId} のアクティブルーム取得: ${rooms.length}件`);

        return rooms;

    } catch (error) {
        handleErrors(error, `スペース ${spaceId} のアクティブルーム取得中にエラーが発生しました`);
        return [];
    }
}

// --- スペース固有のデフォルトルームを作成 ---
async function createDefaultRoomsForSpace(spaceId) {
    try {
        console.log(`🏠 [roomManagement] スペース ${spaceId} のルーム作成開始`);

        // スペース情報を取得してsubRoomSettingsを確認
        const { Space } = require('../db');
        const space = await Space.findOne({ id: spaceId });
        
        if (!space) {
            console.error(`❌ [roomManagement] スペースが見つかりません: ${spaceId}`);
            return [];
        }

        const subRoomSettings = space.settings?.subRoomSettings;
        const createdRooms = [];

        // subRoomSettingsが存在しない場合はデフォルトの「全体」ルームのみ作成
        if (!subRoomSettings || !subRoomSettings.enabled || !subRoomSettings.rooms || subRoomSettings.rooms.length === 0) {
            console.log(`📝 [roomManagement] サブルーム無効 - 全体ルームのみ作成`);
            
            const mainRoomId = `space${spaceId}-main`;
            const existingRoom = await Room.findOne({ id: mainRoomId });
            
            if (existingRoom) {
                console.log(`🔄 [roomManagement] 既存全体ルーム確認: ${existingRoom.name}`);
                createdRooms.push(existingRoom.toObject());
            } else {
                const newRoom = await Room.create({
                    id: mainRoomId,
                    spaceId: spaceId,
                    name: '全体',
                    description: '全ての投稿を表示',
                    isActive: true,
                    messageCount: 0,
                    lastActivity: new Date(),
                    settings: {
                        autoDeleteMessages: false,
                        messageRetentionDays: 30,
                        allowAnonymous: true
                    }
                });
                console.log(`✅ [roomManagement] 全体ルーム作成: ${newRoom.name}`);
                createdRooms.push(newRoom.toObject());
            }
            
            return createdRooms;
        }

        // subRoomSettingsに基づいてルームを作成
        console.log(`📝 [roomManagement] サブルーム有効 - 設定に基づいてルーム作成`);
        
        for (let i = 0; i < subRoomSettings.rooms.length; i++) {
            const roomData = subRoomSettings.rooms[i];
            const roomId = i === 0 ? `space${spaceId}-main` : `space${spaceId}-room${i}`;
            
            // 既存ルームのチェック
            const existingRoom = await Room.findOne({ id: roomId });
            if (existingRoom) {
                console.log(`🔄 [roomManagement] 既存ルーム確認: ${roomData.name} (${roomId})`);
                createdRooms.push(existingRoom.toObject());
                continue;
            }

            // 新しいルームを作成
            const newRoom = await Room.create({
                id: roomId,
                spaceId: spaceId,
                name: roomData.name,
                description: roomData.description || '',
                isActive: true,
                messageCount: 0,
                lastActivity: new Date(),
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 30,
                    allowAnonymous: true
                }
            });

            console.log(`✅ [roomManagement] 新規ルーム作成: ${roomData.name} (${roomId})`);
            createdRooms.push(newRoom.toObject());
        }

        console.log(`🏠 [roomManagement] スペース ${spaceId} のルーム作成完了: ${createdRooms.length}件`);
        return createdRooms;

    } catch (error) {
        handleErrors(error, `スペース ${spaceId} のルーム作成中にエラーが発生しました`);
        return [];
    }
}

module.exports = {
    createDefaultRoomsForSpace, // 新しい関数を追加
    getActiveRooms,
    getActiveRoomsBySpaceId,
    getRoomById,
    updateRoomStats,
    createRoom
};
