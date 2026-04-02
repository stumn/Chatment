// logOperations.js
const { Log, Space, Post } = require('../db');
const { handleErrors } = require('../utils');

// ログを保存
async function saveLog({ userId, userNickname = '', action, detail, spaceId = null,
    level = 'info', source = 'server' }) {
    try {
        const logDetail = detail ? { ...detail } : {};
        let targetSpaceId = spaceId;

        // detail.postId || detail.id からpostIdを取得 
        const relatedPostId = logDetail.postId || logDetail.id;

        // relatedPostId から spaceId とメッセージプレビューを取得
        if (relatedPostId) {
            try {
                const post = await Post.findById(relatedPostId).lean();
                if (!post) {
                    // postが見つからない場合は補完をスキップして通常ログを記録
                    console.warn('Post not found while saving log:', relatedPostId);
                } else {
                    if (!targetSpaceId && post.spaceId) targetSpaceId = post.spaceId;

                    // チャットメッセージまたはドキュメント行の内容をプレビューとして付加
                    if (post.msg) {
                        logDetail.msgPreview = post.msg.length > 30
                            ? post.msg.substring(0, 30) + '...'
                            : post.msg;
                    }
                }
            } catch (e) {
                console.warn('Failed to resolve data from postId:', e.message);
            }
        }

        // ログを保存
        await Log.create({
            userId,
            userNickname: userNickname,
            action,
            spaceId: targetSpaceId,
            detail: logDetail,
            level,
            source,
        });

    } catch (e) {
        handleErrors(e, 'ログ記録失敗:');
    }
}

// 値が存在する場合のみ Date に変換し、未定義/空は null を返す
function toDateOrNull(value) {
    if (!value) return null;
    return new Date(value);
}

// ログの日時フィールドを正規化し、欠落した level/source に既定値を補完する
function ensureLogDefaults(log) {
    const normalizedLog = { ...log };

    if (normalizedLog.timestamp) {
        normalizedLog.timestamp = toDateOrNull(normalizedLog.timestamp);
    }
    if (normalizedLog.createdAt) {
        normalizedLog.createdAt = toDateOrNull(normalizedLog.createdAt);
    }
    if (normalizedLog.updatedAt) {
        normalizedLog.updatedAt = toDateOrNull(normalizedLog.updatedAt);
    }
    if (!normalizedLog.level) {
        normalizedLog.level = 'info';
    }
    if (!normalizedLog.source) {
        normalizedLog.source = 'server';
    }

    return normalizedLog;
}

// 与えられた値が対象スペースID（数値/文字列）と一致するかを判定する
function isSpaceIdMatched(value, spaceIdNum, spaceIdStr) {
    return Boolean(value) && (String(value) === spaceIdStr || parseInt(value) === spaceIdNum);
}

// timestamp を優先してログを時系列順に並べ替える（なければ createdAt を利用）
function sortLogsByTime(logs) {
    return logs.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || new Date(0);
        const timeB = b.timestamp || b.createdAt || new Date(0);
        return timeA - timeB;
    });
}

// アクション別に件数・初回発生時刻・最終発生時刻を集計する
function buildActionStats(logs) {
    const actionStats = {};

    logs.forEach(log => {
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

    return actionStats;
}

// ユーザー別に総アクション数・アクション内訳・活動期間を集計する
function buildUserStats(logs) {
    const userStats = {};

    logs.forEach(log => {
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

    return userStats;
}

// 15分単位でログをバケット化し、時系列グラフ用データを作成する
function buildTimeline(logs) {
    const timelineData = {};

    logs.forEach(log => {
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

    return Object.values(timelineData).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// 隣接ログから注目する状態遷移パターンを抽出する
function buildStateTransitions(logs) {
    const stateTransitions = [];

    for (let i = 0; i < logs.length - 1; i++) {
        const current = logs[i];
        const next = logs[i + 1];
        const currentAction = current.action || 'unknown';
        const nextAction = next.action || 'unknown';

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

    return stateTransitions;
}

// 画面表示向けのサマリー（件数・期間・最頻出など）を生成する
function buildSummary(logs, userStats, actionStats) {
    return {
        totalLogs: logs.length,
        timeRange: {
            start: logs.length > 0 ? logs[0].timestamp || logs[0].createdAt : null,
            end: logs.length > 0 ? logs[logs.length - 1].timestamp || logs[logs.length - 1].createdAt : null
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
}

// 分析結果の確認用に件数・期間・最新ログサンプルをデバッグ出力する
function logAnalysisDebug(spaceId, rawLogsLength, allLogsLength, summary, logs) {
    if (rawLogsLength !== allLogsLength) {
        console.warn(`[Log Analysis] スペース${spaceId}: ${rawLogsLength}件中${allLogsLength}件のログが該当（${rawLogsLength - allLogsLength}件を除外）`);
    } else {
        console.log(`[Log Analysis] スペース${spaceId}: ${allLogsLength}件のログを取得`);
    }

    console.log(`[Log Analysis] 記録期間 - 開始: ${summary.timeRange.start}, 終了: ${summary.timeRange.end}`);

    if (logs.length > 0) {
        const sampleLog = logs[logs.length - 1];
        console.log('[Log Analysis] 最新ログサンプル:', {
            action: sampleLog.action,
            level: sampleLog.level,
            source: sampleLog.source,
            userNickname: sampleLog.userNickname,
            hasDetail: !!sampleLog.detail
        });
    }
}

// スペースIDに関連するログを分析
async function analyzeSpaceLogs(spaceId) {
    try {
        const spaceIdNum = parseInt(spaceId);
        const spaceIdStr = String(spaceId);

        // スペース情報を取得
        const spaceData = await Space.findOne({ id: spaceIdNum }).lean();

        // 1. 全ログを時系列で取得（複数条件で広く取得）
        const rawLogs = await Log.find({
            $or: [
                { spaceId: spaceIdNum },         // 数値型のspaceId
                { spaceId: spaceIdStr },          // 文字列型のspaceId
                { 'detail.spaceId': spaceIdStr }, // detail内のspaceId（文字列）
                { 'detail.spaceId': spaceIdNum }, // detail内のspaceId（数値）
            ]
        })
            .sort({ timestamp: 1, createdAt: 1 })
            .lean();

        const normalizedLogs = rawLogs.map(ensureLogDefaults);

        // 2. 指定されたspaceIdのログのみであることを検証・フィルタリング
        const allLogs = normalizedLogs.filter(log => {
            if (isSpaceIdMatched(log.spaceId, spaceIdNum, spaceIdStr)) {
                return true;
            }

            return isSpaceIdMatched(log.detail?.spaceId, spaceIdNum, spaceIdStr);
        });

        // フィルタリング後、時系列順に再ソート（timestamp優先、なければcreatedAt）
        sortLogsByTime(allLogs);

        const actionStats = buildActionStats(allLogs);
        const userStats = buildUserStats(allLogs);
        const timeline = buildTimeline(allLogs);
        const stateTransitions = buildStateTransitions(allLogs);
        const summary = buildSummary(allLogs, userStats, actionStats);

        logAnalysisDebug(spaceId, rawLogs.length, allLogs.length, summary, allLogs);

        return {
            success: true,
            spaceData: spaceData ? { id: spaceData.id, name: spaceData.name } : null,
            summary,
            actionStats,
            userStats,
            timeline,
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
