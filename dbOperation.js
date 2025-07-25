// dbOperations.js
const { mongoose, User, Post, Log } = require('./db');
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
async function saveRecord(nickname, msg, userId, displayOrder) {
    try {
        // userIdが空文字列・null・undefined・不正なObjectIdの場合はundefinedにする
        let validUserId = userId;
        if (!userId || typeof userId !== 'string' || userId.trim() === '' || !userId.match(/^[a-fA-F0-9]{24}$/)) {
            validUserId = undefined;
        }
        const npData = { nickname, msg, displayOrder: displayOrder || 0 };
        if (validUserId) npData.userId = validUserId;
        const newPost = await Post.create(npData);
        return newPost;
    } catch (error) {
        handleErrors(error, 'データ保存時にエラーが発生しました');
    }
}

// チャットメッセージ受送信
async function SaveChatMessage(nickname, msg, userId, displayOrder) {
    try {
        const record = await saveRecord(nickname, msg, userId, displayOrder);
        return organizeLogs(record);
    }
    catch (error) {
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
        isPositive: mySocketId ? post.positive?.some(p => p.userSocketId === mySocketId) : false,
        isNegative: mySocketId ? post.negative?.some(n => n.userSocketId === mySocketId) : false,
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

// --- displayOrderを指定して空白行を追加 ---
// async function addDocRow({ nickname, msg = '', displayOrder }) {
//     try {
//         // displayOrderが未指定または0なら最大値+1
//         let order = displayOrder;
//         if (!Number.isFinite(order) || order === 0) {
//             const maxOrderPost = await Post.findOne().sort({ displayOrder: -1 });
//             order = maxOrderPost && Number.isFinite(maxOrderPost.displayOrder) ? maxOrderPost.displayOrder + 1 : 1;
//         }
//         const newPost = await Post.create({
//             nickname,
//             msg,
//             displayOrder: order
//         });
//         return organizeLogs(newPost);
//     } catch (error) {
//         handleErrors(error, 'addDocRow 新規行追加時にエラーが発生しました');
//     }
// }
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
        console.log('updateDisplayOrder:', { postId, newDisplayOrder });

        const post = await Post.findById(postId);
        if (!post) throw new Error(`Post not found: ${postId}`);
        console.log('Found post:', post);

        post.displayOrder = newDisplayOrder;
        const newPost = await post.save();
        
        console.log('Updated post:', newPost);
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

module.exports = {
    saveUser, getPastLogs, organizeCreatedAt, SaveChatMessage,
    getPostsByDisplayOrder, addDocRow, updateDisplayOrder,
    saveLog, // 追加
    deleteDocRow // 追加
};
