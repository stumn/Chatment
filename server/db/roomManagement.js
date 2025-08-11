// roomManagement.js
const { Room } = require('../db');
const { handleErrors } = require('../utils');

// --- デフォルトルームを初期化 ---
async function initializeDefaultRooms() {
    try {
        const defaultRooms = [
            {
                id: 'room-0',
                name: '全体',
                description: '全ての投稿を表示',
                createdByNickname: 'システム',
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 30,
                    allowAnonymous: true
                }
            },
            {
                id: 'room-1',
                name: '発表関連',
                description: '議論をしよう',
                createdByNickname: 'システム',
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 90,
                    allowAnonymous: true
                }
            },
            {
                id: 'room-2',
                name: 'general',
                description: '全員へのアナウンス',
                createdByNickname: 'システム',
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 90,
                    allowAnonymous: true
                }
            },
            {
                id: 'room-3',
                name: 'random',
                description: 'つぶやきを投下するところ',
                createdByNickname: 'システム',
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 30,
                    allowAnonymous: true
                }
            },
            {
                id: 'room-4',
                name: '雑談',
                description: 'とにかく雑談しよう',
                createdByNickname: 'システム',
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 30,
                    allowAnonymous: true
                }
            }
        ];

        for (const roomData of defaultRooms) {

            // 既存のルームがあるかチェック
            const existingRoom = await Room.findOne({ id: roomData.id });

            if (existingRoom) {
                console.log(`🔄 [dbOperation] 既存ルーム確認: ${existingRoom.name} (${existingRoom.id})`);
            } else {
                await Room.create(roomData);
                console.log(`✅ [dbOperation] デフォルトルーム作成: ${roomData.name} (${roomData.id})`);
            }
        }

    } catch (error) {
        handleErrors(error, 'デフォルトルーム初期化中にエラーが発生しました');
    }
}

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
        const { id, name, description, createdByNickname, createdBy, settings = {} } = roomData;

        // 重複チェック
        const existingRoom = await Room.findOne({ id });
        if (existingRoom) { throw new Error(`ルームID ${id} は既に存在します`); }

        // 新しいルームを作成
        const newRoom = await Room.create({
            id,
            name,
            description,
            createdByNickname,
            createdBy,
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

module.exports = {
    initializeDefaultRooms,
    getActiveRooms,
    getRoomById,
    updateRoomStats,
    createRoom
};
