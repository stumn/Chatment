// spaceOperations.js
const { Space, Post } = require('../db');
const { handleErrors } = require('../utils');

// --- スペースの存在確認（バリデーション用） ---
async function validateSpaceExists(spaceId) {
    try {
        if (spaceId === null || spaceId === undefined) {
            return { valid: false, error: 'spaceIdが指定されていません' };
        }

        const space = await Space.findOne({ id: spaceId }).lean().exec();
        
        if (!space) {
            return { valid: false, error: `スペースID ${spaceId} が見つかりません` };
        }

        if (!space.isActive) {
            return { valid: false, error: `スペースID ${spaceId} は非アクティブです`, space };
        }

        return { valid: true, space };

    } catch (error) {
        handleErrors(error, `スペース存在確認中にエラーが発生しました: ${spaceId}`);
        return { valid: false, error: error.message };
    }
}

// --- アクティブなスペース一覧を取得 ---
async function getActiveSpaces() {
    try {
        // まずアクティブスペースのIDを取得
        const spaceIds = await Space.find({ isActive: true }).select('id').lean().exec();

        // 各スペースの統計情報を更新
        console.log(`📊 [spaceOperation] ${spaceIds.length} アクティブスペースの統計情報を更新中...`);
        await Promise.all(spaceIds.map(space => updateSpaceStats(space.id)));

        // 更新後のアクティブスペースデータを取得
        const spaces = await Space.find({ isActive: true })
            .sort({ lastActivity: -1 })
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

        // フロントエンド用にデータ構造を返す（subRoomSettings廃止）
        return space;

    } catch (error) {
        handleErrors(error, `スペース情報取得中にエラーが発生しました: ${spaceId}`);
        return null;
    }
}

// --- 新しいスペースを作成 ---
async function createSpace(spaceData) {
    try {
        const { id, name, settings = {} } = spaceData;

        // 入力バリデーション
        if (!id && id !== 0) {
            throw new Error('スペースIDが指定されていません');
        }
        if (!Number.isInteger(id)) {
            throw new Error('スペースIDは整数である必要があります');
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('スペース名が不正です');
        }

        // 重複チェック
        const existingSpace = await Space.findOne({ id });
        if (existingSpace) {
            throw new Error(`スペースID ${id} は既に存在します`);
        }

        // 新しいスペースを作成（サブルーム設定は廃止）
        const newSpace = await Space.create({
            id,
            name: name.trim(),
            settings: {
                theme: settings.theme || 'default'
            }
        });

        console.log(`🌍 [spaceOperation] 新しいスペース作成: ${name} (${id})`);

        return newSpace.toObject();

    } catch (error) {
        handleErrors(error, 'スペース作成中にエラーが発生しました');
        return null;
    }
}

// --- スペースを更新 ---
async function updateSpace(spaceId, updateData) {
    try {
        const { name } = updateData;

        // 既存のスペースを取得
        const existingSpace = await Space.findOne({ id: spaceId });
        if (!existingSpace) {
            throw new Error(`スペースID ${spaceId} が見つかりません`);
        }

        // 更新データを準備（subRoomSettings廃止）
        const updateFields = {};

        if (name !== undefined) {
            updateFields.name = name;
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
async function updateSpaceStats(spaceId, updateOptions = null) {
    try {
        // 軽量版：インクリメント更新の場合
        if (updateOptions && updateOptions.$inc) {
            const result = await Space.findOneAndUpdate(
                { id: spaceId },
                updateOptions,
                { new: true }
            );
            return result ? result.toObject() : null;
        }

        // 完全版：統計情報を再計算
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
            totalMessageCount,
            participantCount,
            ...(lastPost && { lastActivity: lastPost.createdAt })
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
        const result = await Space.findOneAndUpdate(
            { id: spaceId },
            {
                $set: {
                    isFinished: true,
                    finishedAt: new Date(),
                    isActive: false // 終了時に非アクティブ化も行う
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
        // まず終了済みスペースのIDを取得
        const spaceIds = await Space.find({ isFinished: true }).select('id').lean().exec();

        // 各スペースの統計情報を更新
        console.log(`📊 [spaceOperation] ${spaceIds.length} 終了済みスペースの統計情報を更新中...`);
        await Promise.all(spaceIds.map(space => updateSpaceStats(space.id)));

        // 更新後の終了済みスペースデータを取得
        const spaces = await Space.find({ isFinished: true })
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
    validateSpaceExists,
    getActiveSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    updateSpaceStats,
    getPostsBySpace,
    deactivateSpace,
    finishSpace,
    getFinishedSpaces,
    getAllSpaces
};