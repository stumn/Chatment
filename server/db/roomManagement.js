// roomManagement.js
const { Room } = require('../db');
const { handleErrors } = require('../utils');

// --- アクティブなルーム一覧を取得 ---
async function getActiveRooms() {
    try {
        // アクティブなルームを取得（roomIdの昇順でソート）
        const rooms = await Room.find({ isActive: true }).sort({ id: 1 }).lean().exec();

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
        const { id, spaceId = 0, name, settings = {} } = roomData;

        // 重複チェック
        const existingRoom = await Room.findOne({ id });
        if (existingRoom) { throw new Error(`ルームID ${id} は既に存在します`); }

        // 新しいルームを作成
        const newRoom = await Room.create({
            id,
            spaceId, // スペースIDを追加
            name,
            settings: {
                autoDeleteMessages: settings.autoDeleteMessages || false,
                messageRetentionDays: settings.messageRetentionDays || 30,
                allowAnonymous: settings.allowAnonymous !== false // デフォルトはtrue
            }
        });

        return newRoom.toObject();

    } catch (error) {
        handleErrors(error, 'ルーム作成中にエラーが発生しました');
        return null;
    }
}

// --- スペース固有のアクティブなルーム一覧を取得 ---
async function getActiveRoomsBySpaceId(spaceId) {
    try {
        // 指定されたスペースIDのアクティブなルームを取得（roomIdの昇順でソート）
        const rooms = await Room.find({
            isActive: true,
            spaceId: spaceId
        }).sort({ id: 1 }).lean().exec();

        return rooms;

    } catch (error) {
        handleErrors(error, `スペース ${spaceId} のアクティブルーム取得中にエラーが発生しました`);
        return [];
    }
}

// --- スペース固有のデフォルトルームを作成 ---
async function createDefaultRoomsForSpace(spaceId) {
    try {
        // スペース情報を取得
        const { Space } = require('../db');
        const space = await Space.findOne({ id: spaceId });

        if (!space) {
            console.error(`❌ [roomManagement] スペースが見つかりません: ${spaceId}`);
            return [];
        }

        // サブルーム機能廃止により、常に"全体"ルームのみ作成
        const createdRooms = [];
        const mainRoomId = `space${spaceId}-main`;
        const existingRoom = await Room.findOne({ id: mainRoomId });

        if (existingRoom) {
            createdRooms.push(existingRoom.toObject());
        } else {
            const newRoom = await Room.create({
                id: mainRoomId,
                spaceId: spaceId,
                name: '全体',
                isActive: true,
                messageCount: 0,
                lastActivity: new Date(),
                settings: {
                    autoDeleteMessages: false,
                    messageRetentionDays: 30,
                    allowAnonymous: true
                }
            });
            createdRooms.push(newRoom.toObject());
        }

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
