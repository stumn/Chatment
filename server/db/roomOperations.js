// roomOperations.js
const { Post } = require('../db');
const { handleErrors } = require('../utils');
const { processXlogs } = require('./userOperations');

// ルーム機能用の最適化されたデータベース操作

// --- ルーム別履歴取得（最適化版・スペース対応）---
async function getRoomHistory(roomId, spaceId = null) {
    try {
        // roomIdからspaceIdを抽出（例: space1761270106-main → 1761270106）
        const extractedSpaceId = roomId.match(/space(\d+)-/)?.[1];
        const targetSpaceId = spaceId || (extractedSpaceId ? parseInt(extractedSpaceId) : null);

        if (!targetSpaceId) {
            console.warn(`⚠️ [dbOperation] spaceIdを特定できません: ${roomId}`);
            return [];
        }

        // クエリ条件を構築
        // 新規データはroomIdで、既存データ（roomId=null）はspaceIdでフィルタリング
        const query = {
            spaceId: targetSpaceId,
            $or: [
                { roomId: roomId },      // 新しいデータ（roomId付き）
                { roomId: null },        // 既存データ（roomIdなし）
                { roomId: { $exists: false } } // roomIdフィールド自体がない古いデータ
            ]
        };

        console.log(`🔍 [dbOperation] クエリ実行:`, JSON.stringify(query));

        // デバッグ: そのスペースの全投稿数を確認
        const allPostsCount = await Post.countDocuments({ spaceId: targetSpaceId });
        console.log(`📊 [dbOperation] スペース${targetSpaceId}の全投稿数: ${allPostsCount}件`);

        // デバッグ: roomIdがnullの投稿数を確認
        const nullRoomIdCount = await Post.countDocuments({ spaceId: targetSpaceId, roomId: null });
        console.log(`📊 [dbOperation] スペース${targetSpaceId}でroomId=nullの投稿: ${nullRoomIdCount}件`);

        // デバッグ: roomIdが存在しない投稿数を確認
        const noRoomIdCount = await Post.countDocuments({ spaceId: targetSpaceId, roomId: { $exists: false } });
        console.log(`📊 [dbOperation] スペース${targetSpaceId}でroomId未定義の投稿: ${noRoomIdCount}件`);

        // デバッグ: 実際のspaceIdの値を確認（型の問題かもしれない）
        const samplePost = await Post.findOne({ spaceId: targetSpaceId });
        if (samplePost) {
            console.log(`📝 [dbOperation] サンプル投稿:`, {
                id: samplePost._id,
                spaceId: samplePost.spaceId,
                spaceIdType: typeof samplePost.spaceId,
                roomId: samplePost.roomId,
                roomIdType: typeof samplePost.roomId,
                msg: samplePost.msg?.substring(0, 30)
            });
        } else {
            console.log(`❌ [dbOperation] スペース${targetSpaceId}の投稿が見つかりません`);
        }

        // ルームの投稿を取得（新しい順・パフォーマンス向上のためleanクエリ）
        const posts = await Post.find(query).sort({ createdAt: -1 }).lean().exec();

        console.log(`📚 [dbOperation] ${roomId}の履歴取得完了 (スペース${targetSpaceId}): ${posts.length}件`);

        // 時系列順に並び替えて返す（古い順）
        const sortedPosts = posts.reverse();

        return await processXlogs(sortedPosts);

    } catch (error) {
        handleErrors(error, `ルーム履歴取得中にエラーが発生しました: ${roomId}`);
        return [];
    }
}

// --- 全ルーム一覧取得（パフォーマンス測定版）---
async function getAllRoomsWithStats() {
    try {
        // ルーム別の投稿数と最新投稿時刻を集計
        const roomStats = await Post.aggregate([
            {
                $match: { roomId: { $ne: null } } // roomIdがnullでないもののみ
            },
            {
                $group: {
                    _id: '$roomId',
                    messageCount: { $sum: 1 },
                    lastMessageAt: { $max: '$createdAt' },
                    participants: { $addToSet: '$nickname' } // 重複排除でニックネーム収集
                }
            },
            {
                $project: {
                    roomId: '$_id',
                    messageCount: 1,
                    lastMessageAt: 1,
                    participantCount: { $size: '$participants' }
                }
            }
        ]);
        console.log(`📊 [dbOperation] ルーム統計取得完了: ${roomStats.length}ルーム`);

        return roomStats;
    } catch (error) {
        handleErrors(error, 'ルーム統計取得中にエラーが発生しました');
        return [];
    }
}

// --- パフォーマンス測定用: ルーム別メッセージ数取得 ---
async function getRoomMessageCounts() {
    try {
        const counts = await Post.aggregate([
            {
                $group: {
                    _id: '$roomId',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        console.log('📈 [dbOperation] ルーム別メッセージ数:', counts);

        return counts;
    } catch (error) {
        handleErrors(error, 'ルーム別メッセージ数取得中にエラーが発生しました');
        return [];
    }
}

// --- インデックス使用状況の確認（開発用・スペース対応）---
async function explainRoomQuery(roomId, spaceId = null) {
    try {
        const query = { roomId };
        if (spaceId) {
            query.spaceId = spaceId;
        }

        const explanation = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .explain('executionStats');

        console.log('🔍 [dbOperation] クエリ実行計画:', {
            executionTimeMillis: explanation.executionStats.executionTimeMillis,
            totalDocsExamined: explanation.executionStats.totalDocsExamined,
            totalDocsReturned: explanation.executionStats.totalDocsReturned,
            indexUsed: explanation.executionStats.executionStages.indexName || 'No index used'
        });

        return explanation;
    } catch (error) {
        handleErrors(error, 'クエリ実行計画の取得中にエラーが発生しました');
    }
}

module.exports = {
    getRoomHistory,
    getAllRoomsWithStats,
    getRoomMessageCounts,
    explainRoomQuery
};
