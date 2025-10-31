// spaceOperations.js
const { Space, Room, Post } = require('../db');
const { handleErrors } = require('../utils');
const { createDefaultRoomsForSpace } = require('./roomManagement'); // 追加

const DEFAULT_SPACE_ID = 0; // デフォルトスペースは整数の0

// --- デフォルトスペースを初期化 ---
async function initializeDefaultSpace() {
    try {
        // デフォルトスペースが存在するかチェック
        const existingSpace = await Space.findOne({ id: DEFAULT_SPACE_ID });
        if (existingSpace) {
            return existingSpace;
        }

        // デフォルトスペースを作成
        const defaultSpace = await Space.create({
            id: DEFAULT_SPACE_ID,
            name: 'デフォルトスペース',
            settings: {
                theme: 'default'
            }
        });

        return defaultSpace.toObject();

    } catch (error) {
        handleErrors(error, 'デフォルトスペース初期化中にエラーが発生しました');
        return null;
    }
}

// --- 既存データをデフォルトスペースに移行 ---
async function migrateExistingDataToSpace() {
    try {
        console.log('🔄 [spaceOperation] 既存データの移行を開始...');

        // デフォルトスペースを初期化
        await initializeDefaultSpace();

        // 1. spaceIdが未設定のルームを更新
        const roomsUpdated = await Room.updateMany(
            { spaceId: { $exists: false } },
            { $set: { spaceId: DEFAULT_SPACE_ID } }
        );
        console.log(`📁 [spaceOperation] ${roomsUpdated.modifiedCount} 件のルームを移行しました`);

        // 2. spaceIdが未設定の投稿を更新
        const postsUpdated = await Post.updateMany(
            { spaceId: { $exists: false } },
            { $set: { spaceId: DEFAULT_SPACE_ID } }
        );
        console.log(`📝 [spaceOperation] ${postsUpdated.modifiedCount} 件の投稿を移行しました`);

        // 3. デフォルトスペースの統計情報を更新
        await updateSpaceStats(DEFAULT_SPACE_ID);

        console.log('✅ [spaceOperation] 既存データの移行が完了しました');
        return true;

    } catch (error) {
        handleErrors(error, '既存データ移行中にエラーが発生しました');
        return false;
    }
}

// --- アクティブなスペース一覧を取得 ---
async function getActiveSpaces() {
    try {
        // アクティブスペースのIDを取得（新しいスキーマのみ）
        const spaceIds = await Space.find({ status: 'active' }).select('id').lean().exec();

        // 各スペースの統計情報を更新
        console.log(`📊 [spaceOperation] ${spaceIds.length} アクティブスペースの統計情報を更新中...`);
        await Promise.all(spaceIds.map(space => updateSpaceStats(space.id)));

        // 更新後のアクティブスペースデータを取得
        const spaces = await Space.find({ status: 'active' })
            .sort({ 'stats.lastActivity': -1 })
            .lean()
            .exec();

        console.log(`🌍 [spaceOperation] アクティブスペース ${spaces.length} 件を取得（統計情報更新済み）`);

        return spaces;

    } catch (error) {
        handleErrors(error, 'アクティブスペース取得中にエラーが発生しました');
        return [];
    }
}

// --- スペース情報を取得 ---
async function getSpaceById(spaceId) {
    try {
        const space = await Space.findOne({ id: spaceId }).lean().exec();
        if (!space) {
            console.warn(`⚠️ [spaceOperation] スペースが見つかりません: ${spaceId}`);
            return null;
        }

        return space;

    } catch (error) {
        handleErrors(error, `スペース情報取得中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- 新しいスペースを作成 ---
async function createSpace(spaceData) {
    try {
        const { id, name, settings = {}, subRoomSettings } = spaceData;

        // 重複チェック
        const existingSpace = await Space.findOne({ id });
        if (existingSpace) {
            throw new Error(`スペースID ${id} は既に存在します`);
        }

        // roomConfig の構築（新形式のみ）
        const roomConfig = {
            mode: subRoomSettings?.enabled ? 'multi' : 'single',
            rooms: (subRoomSettings?.rooms || [{ name: '全体' }]).map((room, index) => ({
                name: room.name,
                isDefault: index === 0
            }))
        };

        // 新しいスペースを作成（新しいスキーマのみ）
        const newSpace = await Space.create({
            id,
            name,
            status: 'active',
            roomConfig: roomConfig,
            stats: {
                totalMessages: 0,
                activeRooms: 0,
                lastActivity: new Date()
            }
        });

        console.log(`🌍 [spaceOperation] 新しいスペース作成: ${name} (${id})`);

        // 統合されたルーム作成関数を使用
        const createdRooms = await createDefaultRoomsForSpace(id);
        console.log(`🏠 [spaceOperation] スペース ${id} のルーム作成完了: ${createdRooms.length}件`);

        return newSpace.toObject();

    } catch (error) {
        handleErrors(error, 'スペース作成中にエラーが発生しました');
        return null;
    }
}

// --- スペースを更新 ---
async function updateSpace(spaceId, updateData) {
    try {
        const { name, subRoomSettings } = updateData;

        // 既存のスペースを取得
        const existingSpace = await Space.findOne({ id: spaceId });
        if (!existingSpace) {
            throw new Error(`スペースID ${spaceId} が見つかりません`);
        }

        // 更新データを準備
        const updateFields = {};

        if (name !== undefined) {
            updateFields.name = name;
        }

        // subRoomSettings が提供された場合の処理
        if (subRoomSettings) {
            const finalSubRoomSettings = {
                enabled: subRoomSettings.enabled || false,
                rooms: subRoomSettings.rooms || [{ name: '全体' }]
            };

            // 新形式のroomConfigを更新（新しいスキーマのみ）
            const roomConfig = {
                mode: finalSubRoomSettings.enabled ? 'multi' : 'single',
                rooms: finalSubRoomSettings.rooms.map((room, index) => ({
                    name: room.name,
                    isDefault: index === 0
                }))
            };
            updateFields.roomConfig = roomConfig;

            // サブルーム機能が有効で新しいルームが追加された場合、実際のルームも作成
            if (finalSubRoomSettings.enabled) {
                const existingRooms = await Room.find({ spaceId, isActive: true }).select('name').lean();
                const existingRoomNames = existingRooms.map(r => r.name);

                for (let i = 0; i < finalSubRoomSettings.rooms.length; i++) {
                    const roomData = finalSubRoomSettings.rooms[i];
                    if (!existingRoomNames.includes(roomData.name)) {
                        // ユニークなルームIDを生成（タイムスタンプベース）
                        const roomId = `space${spaceId}-room${Date.now()}-${i}`;

                        // 新しいルームを作成（新形式のみ）
                        await Room.create({
                            id: roomId,
                            name: roomData.name,
                            spaceId: spaceId,
                            isActive: true,
                            isDefault: i === 0,
                            stats: {
                                messageCount: 0,
                                lastActivity: new Date()
                            }
                        });
                        console.log(`🏠 [spaceOperation] 新規ルーム作成: ${roomData.name} (ID: ${roomId}, スペース: ${spaceId})`);
                    }
                }
            }
        }

        // スペースを更新
        const updatedSpace = await Space.findOneAndUpdate(
            { id: spaceId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedSpace) {
            throw new Error(`スペースID ${spaceId} の更新に失敗しました`);
        }

        console.log(`🔄 [spaceOperation] スペース更新: ${name} (${spaceId})`);

        // 統計情報を更新
        await updateSpaceStats(spaceId);

        return updatedSpace.toObject();

    } catch (error) {
        handleErrors(error, `スペース更新中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- スペースの統計情報を更新 ---
async function updateSpaceStats(spaceId) {
    try {
        // ルーム数を取得
        const roomCount = await Room.countDocuments({ spaceId, isActive: true });

        // メッセージ数を取得
        const totalMessageCount = await Post.countDocuments({ spaceId });

        // 累計参加者数を取得（そのスペースで投稿したユニークなニックネーム数）
        const participantCountResult = await Post.aggregate([
            { $match: { spaceId } },
            { $group: { _id: '$nickname' } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const participantCount = participantCountResult.length > 0 ? participantCountResult[0].count : 0;

        // 最後のアクティビティを取得
        const lastPost = await Post.findOne({ spaceId })
            .sort({ createdAt: -1 })
            .select('createdAt')
            .lean()
            .exec();

        const updateData = {
            'stats.activeRooms': roomCount,
            'stats.totalMessages': totalMessageCount,
            'stats.participantCount': participantCount,
            ...(lastPost && { 'stats.lastActivity': lastPost.createdAt })
        };

        await Space.findOneAndUpdate(
            { id: spaceId },
            { $set: updateData },
            { new: true }
        );

        console.log(`📊 [spaceOperation] スペース統計更新: ${spaceId}`, updateData);
        return updateData;

    } catch (error) {
        handleErrors(error, `スペース統計更新中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- スペース別ルーム一覧を取得 ---
async function getRoomsBySpace(spaceId) {
    try {
        const rooms = await Room.find({ spaceId, isActive: true })
            .sort({ lastActivity: -1 })
            .lean()
            .exec();

        console.log(`🏠 [spaceOperation] スペース ${spaceId} のルーム ${rooms.length} 件を取得`);

        return rooms;

    } catch (error) {
        handleErrors(error, `スペース別ルーム取得中にエラーが発生しました: ${spaceId}`);
        return [];
    }
}

// --- スペース別投稿を取得 ---
async function getPostsBySpace(spaceId, limit = 100) {
    try {
        const posts = await Post.find({ spaceId })
            .sort({ displayOrder: 1, createdAt: 1 }) // ドキュメント表示順で並び替え
            .limit(limit)
            .lean()
            .exec();

        console.log(`📝 [spaceOperation] スペース ${spaceId} の投稿 ${posts.length} 件を取得`);

        return posts;

    } catch (error) {
        handleErrors(error, `スペース別投稿取得中にエラーが発生しました: ${spaceId}`);
        return [];
    }
}

// --- スペースを非アクティブ化 ---
async function deactivateSpace(spaceId) {
    try {
        if (spaceId === DEFAULT_SPACE_ID) {
            throw new Error('デフォルトスペースは非アクティブ化できません');
        }

        const result = await Space.findOneAndUpdate(
            { id: spaceId },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!result) {
            throw new Error(`スペースが見つかりません: ${spaceId}`);
        }

        console.log(`🌍 [spaceOperation] スペースを非アクティブ化: ${spaceId}`);
        return result.toObject();

    } catch (error) {
        handleErrors(error, `スペース非アクティブ化中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- スペースを終了状態にする ---
async function finishSpace(spaceId) {
    try {
        if (spaceId === DEFAULT_SPACE_ID) {
            throw new Error('デフォルトスペースは終了できません');
        }

        const result = await Space.findOneAndUpdate(
            { id: spaceId },
            {
                $set: {
                    status: 'finished',
                    finishedAt: new Date()
                }
            },
            { new: true }
        );

        if (!result) {
            throw new Error(`スペースが見つかりません: ${spaceId}`);
        }

        console.log(`🏁 [spaceOperation] スペースを終了: ${spaceId}`);
        return result.toObject();

    } catch (error) {
        handleErrors(error, `スペース終了中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- 終了済みスペース一覧を取得 ---
async function getFinishedSpaces() {
    try {
        // 終了済みスペースのIDを取得（新しいスキーマのみ）
        const spaceIds = await Space.find({ status: 'finished' }).select('id').lean().exec();

        // 各スペースの統計情報を更新
        console.log(`📊 [spaceOperation] ${spaceIds.length} 終了済みスペースの統計情報を更新中...`);
        await Promise.all(spaceIds.map(space => updateSpaceStats(space.id)));

        // 更新後の終了済みスペースデータを取得
        const spaces = await Space.find({ status: 'finished' })
            .sort({ finishedAt: -1 })
            .lean()
            .exec();

        console.log(`🏁 [spaceOperation] 終了済みスペース ${spaces.length} 件を取得（統計情報更新済み）`);

        return spaces;

    } catch (error) {
        handleErrors(error, '終了済みスペース取得中にエラーが発生しました');
        return [];
    }
}

// --- 全スペース一覧を取得（管理者用） ---
async function getAllSpaces() {
    try {
        // まず全スペースのIDを取得
        const spaceIds = await Space.find({}).select('id').lean().exec();

        // 各スペースの統計情報を更新
        console.log(`📊 [spaceOperation] ${spaceIds.length} スペースの統計情報を更新中...`);
        await Promise.all(spaceIds.map(space => updateSpaceStats(space.id)));

        // 更新後の全スペースデータを取得
        const spaces = await Space.find({})
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        console.log(`🌍 [spaceOperation] 全スペース ${spaces.length} 件を取得（統計情報更新済み）`);

        return spaces;

    } catch (error) {
        handleErrors(error, '全スペース取得中にエラーが発生しました');
        return [];
    }
}

module.exports = {
    DEFAULT_SPACE_ID,
    initializeDefaultSpace,
    migrateExistingDataToSpace,
    getActiveSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    updateSpaceStats,
    getRoomsBySpace,
    getPostsBySpace,
    deactivateSpace,
    finishSpace,
    getFinishedSpaces,
    getAllSpaces
};