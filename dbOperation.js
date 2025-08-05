// dbOperations.js
const { mongoose, User, Post, Log, Room } = require('./db');
const { handleErrors } = require('./utils');

// ユーザーモデルに保存
async function saveUser(nickname, status, ageGroup, socketId) { // socketId は配列で保存
    try {
        const userData = { nickname, status, ageGroup, socketId };
        const newUser = await User.create(userData);
        return newUser;
    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
    }
}

// ログイン時・過去ログをDBから取得
async function getPastLogs(nickname) {
    try {
        let posts = await Post.find({});
        const pastLogs = await processXlogs(posts);
        return pastLogs;
    } catch (error) {
        handleErrors(error, 'getPastLogs 過去ログ取得中にエラーが発生しました');
    }
}

async function processXlogs(xLogs) {
    // const xLogs = await Promise.all(xLogs.map(organizeLogs));
    const result = [];
    xLogs.forEach(e => {
        e.createdAt = e.createdAt;
        e = organizeLogs(e);
        result.push(e);
    });
    return result;
}

function organizeCreatedAt(createdAt) {
    const UTCdate = new Date(createdAt);
    if (isNaN(UTCdate.getTime())) {
        console.error("無効な日時:", createdAt);
        return "Invalid Date";
    }
    return UTCdate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

// データベースにレコードを保存
async function saveRecord(nickname, msg, userId, displayOrder, roomId = null) {
    try {
        // userIdが空文字列・null・undefined・不正なObjectIdの場合はundefinedにする
        let validUserId = userId;
        if (!userId || typeof userId !== 'string' || userId.trim() === '' || !userId.match(/^[a-fA-F0-9]{24}$/)) {
            validUserId = undefined;
        }
        const npData = {
            nickname,
            msg,
            displayOrder: displayOrder || 0,
            ...(validUserId && { userId: validUserId }),
            ...(roomId && { roomId })
        };
        const newPost = await Post.create(npData);
        return newPost;
    } catch (error) {
        handleErrors(error, 'データ保存時にエラーが発生しました');
    }
}

// チャットメッセージ受送信
async function SaveChatMessage({ nickname, message, userId, displayOrder = 0, roomId = null }) {
    try {
        const record = await saveRecord(nickname, message, userId, displayOrder, roomId);
        return organizeLogs(record);
    } catch (error) {
        handleErrors(error, 'チャット受送信中にエラーが発生しました');
    }
}

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

// --- displayOrder順で全Postを取得 ---
async function getPostsByDisplayOrder() {
    try {
        const posts = await Post.find().sort({ displayOrder: 1 });
        return processXlogs(posts);
    } catch (error) {
        handleErrors(error, 'displayOrder順でのPost取得中にエラーが発生しました');
    }
}

async function addDocRow({ nickname, msg = '', displayOrder }) {
    try {
        let order = displayOrder;
        if (!Number.isFinite(order)) {
            const maxOrderPost = await Post.findOne().sort({ displayOrder: -1 });
            order = maxOrderPost && Number.isFinite(maxOrderPost.displayOrder) ? maxOrderPost.displayOrder + 1 : 1;
        }
        const now = new Date();
        const newPost = await Post.create({
            nickname,
            msg,
            displayOrder: order,
            previousData: {
                nickname,
                createdAt: now
            }
        });
        return organizeLogs(newPost);
    } catch (error) {
        handleErrors(error, 'addDocRow 新規行追加時にエラーが発生しました');
    }
}

// --- 並び替え(doc-reorder)に合わせて、displayOrderを更新 ---
async function updateDisplayOrder(postId, newDisplayOrder) {
    try {
        const post = await Post.findById(postId);
        if (!post) throw new Error(`Post not found: ${postId}`);

        post.displayOrder = newDisplayOrder;
        const newPost = await post.save();

        return organizeLogs(newPost);
    } catch (error) {
        handleErrors(error, 'displayOrder更新中にエラーが発生しました');
    }
}

// ログを保存
async function saveLog({ userId, userNickname = '', action, detail }) {
    try {
        await Log.create({ userId, userNickname, action, detail, timestamp: new Date() });
    } catch (e) {
        // ログ記録失敗時も他機能に影響しない
        console.error('ログ記録失敗:', e);
    }
}

// --- 指定idのPostを削除 ---
async function deleteDocRow(id) {
    try {
        const deleted = await Post.findByIdAndDelete(id);
        return deleted ? organizeLogs(deleted) : null;
    } catch (error) {
        handleErrors(error, 'deleteDocRow 削除時にエラーが発生しました');
    }
}

// ルーム機能用の最適化されたデータベース操作

// --- ルーム別履歴取得（最適化版）---
async function getRoomHistory(roomId, limit = 50) {
    try {
        console.log(`📚 [dbOperation] ルーム履歴取得開始: ${roomId}, 上限: ${limit}件`);

        const posts = await Post.find({ roomId })
            .sort({ createdAt: -1 }) // 新しい順
            .limit(limit)
            .lean() // パフォーマンス向上のためleanクエリ使用
            .exec();

        console.log(`📚 [dbOperation] ${roomId}の履歴取得完了: ${posts.length}件`);

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
        console.time('getRoomsStats');

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

        console.timeEnd('getRoomsStats');
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
        console.time('getRoomMessageCounts');

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

        console.timeEnd('getRoomMessageCounts');
        console.log('📈 [dbOperation] ルーム別メッセージ数:', counts);

        return counts;
    } catch (error) {
        handleErrors(error, 'ルーム別メッセージ数取得中にエラーが発生しました');
        return [];
    }
}

// --- インデックス使用状況の確認（開発用）---
async function explainRoomQuery(roomId) {
    try {
        const explanation = await Post.find({ roomId })
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

// ルーム管理用のデータベース操作関数

// --- デフォルトルームを初期化 ---
async function initializeDefaultRooms() {
    try {
        console.log('🏠 [dbOperation] デフォルトルーム初期化開始');

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
            if (!existingRoom) {
                await Room.create(roomData);
                console.log(`✅ [dbOperation] デフォルトルーム作成: ${roomData.name} (${roomData.id})`);
            } else {
                console.log(`🔄 [dbOperation] 既存ルーム確認: ${existingRoom.name} (${existingRoom.id})`);
            }
        }

        console.log('🏠 [dbOperation] デフォルトルーム初期化完了');

    } catch (error) {
        handleErrors(error, 'デフォルトルーム初期化中にエラーが発生しました');
    }
}

// --- アクティブなルーム一覧を取得 ---
async function getActiveRooms() {
    try {
        console.time('getActiveRooms');

        const rooms = await Room.find({ isActive: true })
            .sort({ id: 1 }) // roomIdの昇順でソート（room-1, room-2, room-3, room-4）
            .lean()
            .exec();

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
        const room = await Room.findOne({ id: roomId }).lean().exec();
        if (!room) {
            console.warn(`⚠️ [dbOperation] ルームが見つかりません: ${roomId}`);
            return null;
        }

        console.log(`🏠 [dbOperation] ルーム情報取得: ${room.name} (${roomId})`);
        return room;

    } catch (error) {
        handleErrors(error, `ルーム情報取得中にエラーが発生しました: ${roomId}`);
        return null;
    }
}

// --- ルームの統計情報を更新 ---
async function updateRoomStats(roomId, updates = {}) {
    try {
        const updateData = {
            lastActivity: new Date(),
            ...updates
        };

        const updatedRoom = await Room.findOneAndUpdate(
            { id: roomId },
            { $set: updateData },
            { new: true, lean: true }
        );

        if (updatedRoom) {
            console.log(`📊 [dbOperation] ルーム統計更新: ${roomId}`, updates);
        }

        return updatedRoom;

    } catch (error) {
        handleErrors(error, `ルーム統計更新中にエラーが発生しました: ${roomId}`);
        return null;
    }
}

// --- 新しいルームを作成 ---
async function createRoom(roomData) {
    try {
        const { id, name, description, createdByNickname, createdBy, settings = {} } = roomData;

        // 重複チェック
        const existingRoom = await Room.findOne({ id });
        if (existingRoom) {
            throw new Error(`ルームID ${id} は既に存在します`);
        }

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

//  --- positive, negative 用の関数 ---
async function processPostReaction(postId, userSocketId = null, nickname = '', reactionType) {

    const post = await Post.findById(postId);
    if (!post) return;

    const idx = post[reactionType].findIndex(p => p.userSocketId === userSocketId);
    idx !== -1
        ? post[reactionType].splice(idx, 1)
        : post[reactionType].push({ userSocketId, nickname });

    await post.save();

    return {
        id: post.id,
        reaction: post[reactionType].length,
        userHasReacted: post[reactionType].some(p => p.userSocketId === userSocketId),
    };
}

module.exports = {
    saveUser, getPastLogs, organizeCreatedAt, SaveChatMessage,
    getPostsByDisplayOrder, addDocRow, updateDisplayOrder,
    saveLog, deleteDocRow, processPostReaction,
    // ルーム機能用の関数
    getRoomHistory,
    getAllRoomsWithStats,
    getRoomMessageCounts,
    explainRoomQuery,
    // ルーム管理用の関数
    initializeDefaultRooms,
    getActiveRooms,
    getRoomById,
    updateRoomStats,
    createRoom
};
