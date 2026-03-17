// logOperations.js
const { Log, Space, Room, Post } = require('../db');
const { handleErrors } = require('../utils');

// ログを保存（spaceId対応）
async function saveLog({ userId, userNickname = '', action, detail, spaceId = null, level = 'info', source = 'server' }) {
    try {
        let resolvedSpaceId = spaceId;
        let enrichedDetail = detail ? { ...detail } : {};

        // roomId から spaceId を取得
        if (!resolvedSpaceId && enrichedDetail.roomId) {
            try {
                const room = await Room.findOne({ id: enrichedDetail.roomId }).lean();
                if (room && room.spaceId) resolvedSpaceId = room.spaceId;
            } catch (e) {
                console.warn('Failed to resolve spaceId from roomId:', e.message);
            }
        }

        // postId (detail.postId または detail.id) から spaceId とメッセージプレビューを取得
        const postId = enrichedDetail.postId || enrichedDetail.id;
        if (postId) {
            try {
                const post = await Post.findById(postId).lean();
                if (post) {
                    if (!resolvedSpaceId && post.spaceId) resolvedSpaceId = post.spaceId;
                    // チャットメッセージまたはドキュメント行の内容をプレビューとして付加
                    if (post.msg) {
                        enrichedDetail.msgPreview = post.msg.length > 40
                            ? post.msg.substring(0, 40) + '...'
                            : post.msg;
                    }
                }
            } catch (e) {
                console.warn('Failed to resolve data from postId:', e.message);
            }
        }

        await Log.create({
            userId,
            userNickname,
            action,
            spaceId: resolvedSpaceId,
            detail: enrichedDetail,
            level,
            source,
        });
    } catch (e) {
        handleErrors(e, 'ログ記録失敗:');
    }
}

// スペースIDに関連するログを分析
async function analyzeSpaceLogs(spaceId) {
    try {
        const spaceIdNum = parseInt(spaceId);
        const spaceIdStr = String(spaceId);

        // スペース情報を取得
        const spaceData = await Space.findOne({ id: spaceIdNum }).lean();

        // このスペースに属する全roomIdを取得（数値型と文字列型両方で検索）
        const rooms = await Room.find({
            $or: [
                { spaceId: spaceIdNum },
                { spaceId: spaceIdStr }
            ]
        }).select('id').lean();
        const roomIds = rooms.map(r => r.id);

        if (roomIds.length === 0) {
            console.warn(`[Log Analysis] スペース${spaceId}: 該当するRoomが見つかりませんでした`);
        }

        // 1. 全ログを時系列で取得（複数条件で広く取得）
        const rawLogs = await Log.find({
            $or: [
                { spaceId: spaceIdNum },         // 数値型のspaceId
                { spaceId: spaceIdStr },          // 文字列型のspaceId
                { 'detail.spaceId': spaceIdStr }, // detail内のspaceId（文字列）
                { 'detail.spaceId': spaceIdNum }, // detail内のspaceId（数値）
                { 'detail.roomId': { $in: roomIds } } // roomIdから逆引き
            ]
        })
            .sort({ timestamp: 1, createdAt: 1 })
            .lean();

        // 日付フィールドを正しいDateオブジェクトに変換（.lean()使用時の対策）
        rawLogs.forEach(log => {
            if (log.timestamp) {
                log.timestamp = new Date(log.timestamp);
            }
            if (log.createdAt) {
                log.createdAt = new Date(log.createdAt);
            }
            if (log.updatedAt) {
                log.updatedAt = new Date(log.updatedAt);
            }
            // level/sourceが存在しない古いログにデフォルト値を設定
            if (!log.level) {
                log.level = 'info';
            }
            if (!log.source) {
                log.source = 'server';
            }
        });

        // 日付変換のサンプルをログ出力（デバッグ用）
        if (rawLogs.length > 0) {
            const sampleLog = rawLogs[0];
            console.log(`[Log Analysis] 日付変換サンプル - timestamp: ${sampleLog.timestamp}, createdAt: ${sampleLog.createdAt}`);
        }

        // 2. 指定されたspaceIdのログのみであることを検証・フィルタリング
        const allLogs = rawLogs.filter(log => {
            // トップレベルのspaceIdをチェック
            const logSpaceId = log.spaceId;
            if (logSpaceId && (String(logSpaceId) === spaceIdStr || parseInt(logSpaceId) === spaceIdNum)) {
                return true;
            }

            // detail内のspaceIdをチェック
            const detailSpaceId = log.detail?.spaceId;
            if (detailSpaceId && (String(detailSpaceId) === spaceIdStr || parseInt(detailSpaceId) === spaceIdNum)) {
                return true;
            }

            // roomIdから判定
            const roomId = log.detail?.roomId;
            if (roomId && roomIds.includes(roomId)) {
                return true;
            }

            return false;
        });

        // フィルタリング後、時系列順に再ソート（timestamp優先、なければcreatedAt）
        allLogs.sort((a, b) => {
            const timeA = a.timestamp || a.createdAt || new Date(0);
            const timeB = b.timestamp || b.createdAt || new Date(0);
            return timeA - timeB;
        });

        // フィルタリング結果をログ出力（デバッグ用）
        if (rawLogs.length !== allLogs.length) {
            console.warn(`[Log Analysis] スペース${spaceId}: ${rawLogs.length}件中${allLogs.length}件のログが該当（${rawLogs.length - allLogs.length}件を除外）`);
        } else {
            console.log(`[Log Analysis] スペース${spaceId}: ${allLogs.length}件のログを取得`);
        }

        // 取得したroomIds数も表示
        console.log(`[Log Analysis] スペース${spaceId}に属するRoom数: ${roomIds.length}件 (roomIds: ${roomIds.join(', ')})`);

        // 3. アクション別統計
        const actionStats = {};
        allLogs.forEach(log => {
            const action = log.action || 'unknown';
            if (!actionStats[action]) {
                actionStats[action] = { count: 0, firstOccurrence: null, lastOccurrence: null };
            }
            actionStats[action].count++;
            const timestamp = log.timestamp || log.createdAt;
            if (!actionStats[action].firstOccurrence || timestamp < actionStats[action].firstOccurrence) {
                actionStats[action].firstOccurrence = timestamp;
            }
            if (!actionStats[action].lastOccurrence || timestamp > actionStats[action].lastOccurrence) {
                actionStats[action].lastOccurrence = timestamp;
            }
        });

        // 4. ユーザー別活動統計
        const userStats = {};
        allLogs.forEach(log => {
            const user = log.userNickname || log.detail?.user || log.detail?.nickname || 'unknown';
            if (!userStats[user]) {
                userStats[user] = {
                    totalActions: 0,
                    actions: {},
                    firstSeen: null,
                    lastSeen: null
                };
            }
            userStats[user].totalActions++;
            const action = log.action || 'unknown';
            userStats[user].actions[action] = (userStats[user].actions[action] || 0) + 1;

            const timestamp = log.timestamp || log.createdAt;
            if (!userStats[user].firstSeen || timestamp < userStats[user].firstSeen) {
                userStats[user].firstSeen = timestamp;
            }
            if (!userStats[user].lastSeen || timestamp > userStats[user].lastSeen) {
                userStats[user].lastSeen = timestamp;
            }
        });

        // 5. 時系列データ（15分ごとの集計）
        const timelineData = {};
        allLogs.forEach(log => {
            const timestamp = log.timestamp || log.createdAt;
            if (!timestamp) return;

            const time = new Date(timestamp);
            const minute = Math.floor(time.getMinutes() / 15) * 15;
            time.setMinutes(minute, 0, 0);
            const timeKey = time.toISOString();

            if (!timelineData[timeKey]) {
                timelineData[timeKey] = { timestamp: time, actions: {}, totalCount: 0 };
            }
            const action = log.action || 'unknown';
            timelineData[timeKey].actions[action] = (timelineData[timeKey].actions[action] || 0) + 1;
            timelineData[timeKey].totalCount++;
        });

        // 6. 状態遷移の検出（ログイン→部屋参加などのパターン）
        const stateTransitions = [];
        for (let i = 0; i < allLogs.length - 1; i++) {
            const current = allLogs[i];
            const next = allLogs[i + 1];
            const currentAction = current.action || 'unknown';
            const nextAction = next.action || 'unknown';

            // 興味深い遷移パターンを検出
            if ((currentAction === 'login' && nextAction === 'join-space') ||
                (currentAction === 'join-space' && nextAction === 'send-message') ||
                (currentAction === 'add-line' && nextAction === 'edit-line')) {
                stateTransitions.push({
                    from: currentAction,
                    to: nextAction,
                    user: current.detail?.user || current.detail?.nickname || 'unknown',
                    timestamp: current.timestamp || current.createdAt
                });
            }
        }

        // 7. サマリー生成
        const summary = {
            totalLogs: allLogs.length,
            timeRange: {
                start: allLogs.length > 0 ? allLogs[0].timestamp || allLogs[0].createdAt : null,
                end: allLogs.length > 0 ? allLogs[allLogs.length - 1].timestamp || allLogs[allLogs.length - 1].createdAt : null
            },
            totalUsers: Object.keys(userStats).length,
            totalActions: Object.keys(actionStats).length,
            mostActiveUser: Object.entries(userStats).reduce((max, [user, stats]) =>
                stats.totalActions > (max?.stats?.totalActions || 0) ? { user, stats } : max, null
            ),
            mostCommonAction: Object.entries(actionStats).reduce((max, [action, stats]) =>
                stats.count > (max?.stats?.count || 0) ? { action, stats } : max, null
            )
        };

        // 記録期間をログ出力（デバッグ用）
        console.log(`[Log Analysis] 記録期間 - 開始: ${summary.timeRange.start}, 終了: ${summary.timeRange.end}`);

        // 最新ログのサンプルを出力（level/sourceフィールドの確認用）
        if (allLogs.length > 0) {
            const sampleLog = allLogs[allLogs.length - 1];
            console.log(`[Log Analysis] 最新ログサンプル:`, {
                action: sampleLog.action,
                level: sampleLog.level,
                source: sampleLog.source,
                userNickname: sampleLog.userNickname,
                hasDetail: !!sampleLog.detail
            });
        }

        return {
            success: true,
            spaceData: spaceData ? { id: spaceData.id, name: spaceData.name } : null,
            summary,
            actionStats,
            userStats,
            timeline: Object.values(timelineData).sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            ),
            stateTransitions,
            recentLogs: allLogs.slice(-100).reverse(), // 最新100件を逆順で
            allLogs: allLogs // 全ログを時系列順で（フロント側で表示用）
        };
    } catch (e) {
        handleErrors(e, 'ログ分析失敗:');
        throw e;
    }
}

module.exports = {
    saveLog,
    analyzeSpaceLogs
};
