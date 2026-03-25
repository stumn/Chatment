// userOperations.js
const { User, Post } = require('../db');
const { getSpaceById } = require('./spaceOperations');
const { handleErrors } = require('../utils');

// --- ユーザーモデルに保存(socketId: Array<string>) ---
async function saveUser(nickname, status, ageGroup, socketId, spaceId) {
    try {
        // スペースIDが提供されていない場合はエラー
        if (spaceId == null) {
            throw new Error('スペースIDが指定されていません');
        }

        // スペースが存在するかチェック
        const spaceExists = await getSpaceById(spaceId);
        if (!spaceExists) {
            throw new Error(`スペースID ${spaceId} は存在しません`);
        }

        // スペースが非アクティブまたは終了している場合はエラー
        if (!spaceExists.isActive || spaceExists.isFinished) {
            throw new Error(`スペースID ${spaceId} は現在利用できません（非アクティブまたは終了済み）`);
        }

        const now = new Date();

        // 既存ユーザー更新と新規作成を一本化
        const updatedUser = await User.findOneAndUpdate({
            nickname,
            status,
            ageGroup,
            spaceId
        }, {
            $addToSet: { socketId },
            $push: {
                loginHistory: {
                    socketId,
                    loginAt: now
                }
            },
            $set: { lastLoginAt: now },
            $setOnInsert: {
                nickname,
                status,
                ageGroup,
                spaceId
            }
        }, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        });

        return updatedUser;

    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
        throw error; // エラーを再スローして呼び出し元にも通知
    }
}

// --- ログイン時・過去ログをDBから取得（スペース別） ---
async function getPastLogs(spaceId = null) {
    try {
        if (spaceId == null) {
            throw new Error('スペースIDが指定されていません');
        }

        // 過去ログを取得・整形
        const posts = await Post.find({ spaceId });
        const pastLogs = await processXlogs(posts);

        return pastLogs;

    } catch (error) {
        handleErrors(error, 'getPastLogs 過去ログ取得中にエラーが発生しました');
    }
}

// --- ログを整形---
async function processXlogs(xLogs) {
    return xLogs.map(post => organizeLogs(post));
}

// --- ログを整形 ---
function organizeLogs(post, mySocketId = null) {

    const data = {
        nickname: post.nickname,
        displayName: post.displayName || post.nickname,
        msg: post.msg,
        userId: post.userId,
        spaceId: post.spaceId,
        source: post.source || 'unknown',
        positive: post.positive ? post.positive.length : 0,
        negative: post.negative ? post.negative.length : 0,
        displayOrder: typeof post.displayOrder === 'number' ? post.displayOrder : Number(post.displayOrder),
        indentLevel: post.indentLevel ? post.indentLevel : 0,
        previousData: post.previousData || null,
        id: post._id || post.id, // _idがなければidを使う
        createdAt: post.createdAt,
        userHasVotedPositive: mySocketId ? post.positive?.some(p => p.userSocketId === mySocketId) : false,
        userHasVotedNegative: mySocketId ? post.negative?.some(n => n.userSocketId === mySocketId) : false,
    };
    return data;
}

// --- スペース別ユーザー統計を取得 ---
async function getSpaceUserStats(spaceId) {
    try {
        const stats = await User.aggregate([
            { $match: { spaceId } },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    avgLoginCount: { $avg: { $size: '$loginHistory' } },
                    mostRecentLogin: { $max: '$lastLoginAt' },
                    statusGroups: {
                        $push: {
                            status: '$status',
                            ageGroup: '$ageGroup'
                        }
                    }
                }
            }
        ]);

        // ステータス・年代別の集計
        const statusAgeStats = await User.aggregate([
            { $match: { spaceId } },
            {
                $group: {
                    _id: { status: '$status', ageGroup: '$ageGroup' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            spaceId,
            ...stats[0],
            statusAgeDistribution: statusAgeStats
        };
    } catch (error) {
        handleErrors(error, 'スペースユーザー統計取得時にエラーが発生しました');
        return null;
    }
}

module.exports = {
    saveUser,
    getPastLogs,
    processXlogs,
    organizeLogs,
    getSpaceUserStats
};
