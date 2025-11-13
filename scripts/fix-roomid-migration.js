// fix-roomid-migration.js
// 既存の投稿データのroomIdを正しい値に修正するマイグレーション

require('dotenv').config();
const { mongoose, Post } = require('../server/db');

async function fixRoomIds() {
    console.log('🚀 roomId修正マイグレーション開始...');

    try {
        // すべての投稿を取得
        const allPosts = await Post.find({});
        console.log(`📊 全投稿数: ${allPosts.length}件`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const post of allPosts) {
            const currentRoomId = post.roomId;
            const spaceId = post.spaceId;

            // roomIdが正しい形式かチェック
            const correctRoomId = `space${spaceId}-main`;

            // 以下のケースで修正が必要：
            // 1. roomIdが"space0-main"の場合
            // 2. roomIdがnullの場合
            // 3. roomIdが存在しない場合
            // 4. roomIdがspace{spaceId}-mainの形式でない場合

            const needsUpdate =
                currentRoomId === 'space0-main' ||
                currentRoomId === null ||
                !currentRoomId ||
                (currentRoomId && !currentRoomId.startsWith(`space${spaceId}-`));

            if (needsUpdate) {
                // "space{spaceId}-room1" のような古いサブルーム形式も修正
                if (currentRoomId && currentRoomId.includes('-room')) {
                    console.log(`🔧 サブルーム形式を修正: ${currentRoomId} → ${correctRoomId}`);
                } else if (currentRoomId === 'space0-main') {
                    console.log(`🔧 space0-mainを修正: ${correctRoomId} (spaceId: ${spaceId})`);
                } else {
                    console.log(`🔧 nullまたは未定義を修正: ${correctRoomId} (spaceId: ${spaceId})`);
                }

                await Post.findByIdAndUpdate(post._id, { roomId: correctRoomId });
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n✅ マイグレーション完了！`);
        console.log(`   更新: ${updatedCount}件`);
        console.log(`   スキップ: ${skippedCount}件`);
        console.log(`   合計: ${allPosts.length}件`);

        // 確認: スペースごとのroomId統計
        console.log(`\n📊 スペースごとのroomId統計:`);
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: { spaceId: '$spaceId', roomId: '$roomId' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.spaceId': 1, '_id.roomId': 1 }
            }
        ]);

        stats.forEach(stat => {
            console.log(`   スペース${stat._id.spaceId} / ${stat._id.roomId}: ${stat.count}件`);
        });

    } catch (error) {
        console.error('❌ エラー発生:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 データベース接続を切断しました');
    }
}

// スクリプト実行
fixRoomIds();
