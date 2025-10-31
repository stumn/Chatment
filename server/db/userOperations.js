// userOperations.js
const { User, Post } = require('../db');
const { getSpaceById } = require('./spaceOperations');
const { handleErrors } = require('../utils');

// --- ユーザーモデルに保存(socketId: Array<string>) ---
async function saveUser(nickname, status, ageGroup, socketId, spaceId) {
    try {
        // スペースIDが提供されていない場合はエラー
        if (!spaceId) {
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

        // 既存ユーザーを検索（nickname, status, ageGroup, spaceIdの組み合わせで判定）
        let existingUser = await User.findOne({ 
            nickname, 
            status, 
            ageGroup,
            spaceId
        });

        if (existingUser) {
            // 既存ユーザーが見つかった場合、更新
            
            // socketIdを追加（重複チェック）
            if (!existingUser.socketId.includes(socketId)) {
                existingUser.socketId.push(socketId);
            }
            
            // ログイン履歴を追加
            existingUser.loginHistory.push({
                socketId: socketId,
                loginAt: new Date()
            });
            
            // 最後のログイン日時を更新
            existingUser.lastLoginAt = new Date();
            
            // オンライン状態と最終アクティブ時刻を更新（新しいスキーマのみ）
            existingUser.isOnline = true;
            existingUser.lastSeen = new Date();
            
            // 保存
            const updatedUser = await existingUser.save();
            console.log('📝 既存ユーザーを更新:', nickname, 'スペース:', spaceId, '(', spaceExists.name, ')');
            
            return updatedUser;
        } else {
            // 新規ユーザーの場合、作成（新しいスキーマのみ）
            const userData = { 
                nickname, 
                status, 
                ageGroup, 
                spaceId,
                socketId: [socketId], // 配列として初期化
                loginHistory: [{
                    socketId: socketId,
                    loginAt: new Date()
                }],
                lastLoginAt: new Date(),
                isOnline: true,
                lastSeen: new Date()
                // currentRoom は後でルーム参加時に設定
            };

            const newUser = await User.create(userData);
            console.log('🆕 新規ユーザーを作成:', nickname, 'スペース:', spaceId, '(', spaceExists.name, ')');
            
            return newUser;
        }

    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
        throw error; // エラーを再スローして呼び出し元にも通知
    }
}

// --- ログイン時・過去ログをDBから取得（スペース別） ---
async function getPastLogs(spaceId = null) {
    try {
        if(!spaceId){
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

// --- ログを整形（mapのほうが簡潔ということで変更）---
async function processXlogs(xLogs) {
    return xLogs.map(post => organizeLogs(post));
}

// --- ログを整形 ---
function organizeLogs(post, mySocketId = null) {

    const data = {
        id: post._id || post.id, // _idがなければidを使う
        createdAt: post.createdAt,
        nickname: post.nickname,
        msg: post.msg,
        userId: post.userId,
        positive: post.positive ? post.positive.length : 0,
        negative: post.negative ? post.negative.length : 0,
        userHasVotedPositive: mySocketId ? post.positive?.some(p => p.userSocketId === mySocketId) : false,
        userHasVotedNegative: mySocketId ? post.negative?.some(n => n.userSocketId === mySocketId) : false,
        displayOrder: typeof post.displayOrder === 'number' ? post.displayOrder : Number(post.displayOrder),
        previousData: post.previousData || null
    };
    return data;
}

// --- createdAtを整形 ---
function organizeCreatedAt(createdAt) {

    // createdAtが文字列の場合、Dateオブジェクトに変換
    const UTCdate = new Date(createdAt);

    // UTCdateが無効な場合のエラーハンドリング
    if (isNaN(UTCdate.getTime())) {
        handleErrors("無効な日時:", createdAt);
        return "Invalid Date";
    }

    // UTCdateを日本時間に変換
    return UTCdate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

// --- ユーザーのログイン履歴を取得 ---
async function getUserLoginHistory(nickname, status, ageGroup, spaceId) {
    try {
        const user = await User.findOne({ 
            nickname, 
            status, 
            ageGroup,
            spaceId
        });
        
        if (user) {
            return user.loginHistory;
        }
        
        return [];
    } catch (error) {
        handleErrors(error, 'ユーザーログイン履歴取得時にエラーが発生しました');
        return [];
    }
}

// --- アクティブユーザー一覧を取得（最近ログインしたユーザー） ---
async function getActiveUsers(spaceId = null, limit = 10) {
    try {
        const query = spaceId ? { spaceId } : {};
        
        const users = await User.find(query)
            .sort({ lastLoginAt: -1 })
            .limit(limit)
            .select('nickname status ageGroup spaceId lastLoginAt loginHistory');
            
        return users;
    } catch (error) {
        handleErrors(error, 'アクティブユーザー取得時にエラーが発生しました');
        return [];
    }
}

// --- 特定ユーザーの全スペース参加履歴を取得 ---
async function getUserSpaceHistory(nickname, status, ageGroup) {
    try {
        const users = await User.find({ 
            nickname, 
            status, 
            ageGroup 
        }).select('spaceId lastLoginAt loginHistory createdAt');
        
        return users.map(user => ({
            spaceId: user.spaceId,
            firstJoinedAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            totalLogins: user.loginHistory.length
        }));
    } catch (error) {
        handleErrors(error, 'ユーザースペース履歴取得時にエラーが発生しました');
        return [];
    }
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

// --- 新機能: ルームの参加者数を取得 ---
async function getRoomParticipantCount(spaceId, roomId) {
    try {
        const count = await User.countDocuments({
            spaceId,
            currentRoom: roomId,
            isOnline: true
        });
        
        console.log(`👥 [userOperations] ルーム ${roomId} の参加者数: ${count}`);
        return count;
        
    } catch (error) {
        handleErrors(error, `ルーム参加者数取得時にエラーが発生しました: ${roomId}`);
        return 0;
    }
}

// --- 新機能: スペースの総参加者数を取得 ---
async function getSpaceParticipantCount(spaceId) {
    try {
        const count = await User.countDocuments({
            spaceId,
            isOnline: true
        });
        
        console.log(`👥 [userOperations] スペース ${spaceId} の参加者数: ${count}`);
        return count;
        
    } catch (error) {
        handleErrors(error, `スペース参加者数取得時にエラーが発生しました: ${spaceId}`);
        return 0;
    }
}

// --- 新機能: ユーザーのオフライン状態を設定 ---
async function setUserOffline(userId) {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                isOnline: false,
                lastSeen: new Date(),
                currentRoom: null
            },
            { new: true }
        );
        
        if (updatedUser) {
            console.log(`🔌 [userOperations] ユーザーがオフラインになりました: ${updatedUser.nickname}`);
        }
        
        return updatedUser;
        
    } catch (error) {
        handleErrors(error, `ユーザーオフライン設定時にエラーが発生しました: ${userId}`);
        return null;
    }
}

// --- 新機能: ユーザーの現在のルームを設定 ---
async function setUserCurrentRoom(userId, roomId) {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                currentRoom: roomId,
                lastSeen: new Date()
            },
            { new: true }
        );
        
        if (updatedUser) {
            console.log(`🏠 [userOperations] ユーザー ${updatedUser.nickname} のルームを更新: ${roomId}`);
        }
        
        return updatedUser;
        
    } catch (error) {
        handleErrors(error, `ユーザールーム設定時にエラーが発生しました: ${userId}`);
        return null;
    }
}

module.exports = {
    saveUser,
    getPastLogs,
    processXlogs,
    organizeCreatedAt,
    organizeLogs,
    getUserLoginHistory,
    getActiveUsers,
    getUserSpaceHistory,
    getSpaceUserStats,
    getRoomParticipantCount, // 新機能: ルーム参加者数
    getSpaceParticipantCount, // 新機能: スペース参加者数
    setUserOffline, // 新機能: ユーザーオフライン設定
    setUserCurrentRoom // 新機能: ユーザールーム設定
};
