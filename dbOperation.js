// dbOperations.js
const { mongoose, User, Post } = require('./db');
const { handleErrors } = require('./utils');

// ユーザーモデルに保存
async function saveUser(nickname, status, ageGroup, socketId) { // socketId は配列で保存
    try {
        const userData = { nickname, status, ageGroup, socketId};
        const newUser = await User.create(userData);
        return newUser;
    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
    }
}

// ユーザー情報を取得
async function getUserInfo(nickname) { // nickname 検索(何に使うか未定)
    try {
        const userInfo = await User.findOne().where('nickname').equals(nickname);
        return userInfo;
    } catch {
        handleErrors(error, 'ユーザー情報取得時にエラーが発生しました');
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
async function saveRecord(nickname, msg) {
    try {
        const stars = [];

        const npData = { nickname, msg, stars };

        const newPost = await Post.create(npData);

        return newPost;
    } catch (error) {
        handleErrors(error, 'データ保存時にエラーが発生しました');
    }
}

// チャットメッセージ受送信
async function SaveChatMessage(nickname, msg) {
    try {
        const record = await saveRecord(nickname, msg);
        return organizeLogs(record);
    }
    catch (error) {
        handleErrors(error, 'チャット受送信中にエラーが発生しました');
    }
}

const retries = 3;
const delay = 3000;

async function findPost(msgId) {

    // リトライ機能を追加 -> 3回リトライしても見つからない場合はエラーを投げる
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (!msgId) { throw new Error('msgId がありません'); }
            const post = await Post.findById(msgId);
            if (!post) { throw new Error(`投稿が見つかりません: ${msgId}`); }
            return post; // 見つかった場合
        } catch (error) {
            console.error(`エラー (attempt ${attempt}):`, error.message);
            if (attempt === retries) {
                handleErrors(error, `投稿見つからない: ${msgId}`);
                throw error; // 最後のリトライで失敗した場合はエラーを投げる
            }
            console.log(`リトライします (${delay / 1000}秒後)...`);
            await new Promise(resolve => setTimeout(resolve, delay)); // 指定された時間待機
        }
    }
}

// ドキュメントページ用 DBからの過去ログ取得の関数
async function fetchPosts(nickname) {

    // まずユーザー情報のDBから、nameTomatchを取得
    const nameToMatch = await getUserInfo(nickname);

    if (!nameToMatch) {
        console.error('ユーザー情報が見つかりませんでした:', nickname);
        return null; // ユーザー情報が見つからない場合は null を返す
    }

    try {
        const messages = [];

        const posts = await Post.find({ 'stars': { '$elemMatch': { 'nickname': nameToMatch } } });
        posts.forEach(e => organizeAndPush(messages, e));

        messages.sort((a, b) => a.createdAt - b.createdAt);

        return messages;
    } catch (error) {
        handleErrors(error, 'api 過去ログ取得中にエラーが発生しました');
    }

}

async function fetchPosts_everybody() {
    try {
        const messages = [];

        const posts = await Post.find({
            $or: [
                { "stars.1": { $exists: true } }, // stars配列の長さが2以上
                { "childPostIds.0": { $exists: true } } // childPostIds配列の長さが1以上
            ]
        });

        posts.forEach(e => {
            organizeAndPush(messages, e);
        });

        return messages;
    }
    catch (error) {
        handleErrors(error, 'api 過去ログ取得中にエラーが発生しました');
    }
}

function organizeAndPush(messages, e, isChat = true) {
    if (isChat) {
        messages.push({ nickname: e.nickname, msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: wasRocketed });

    } else {
        messages.push({ nickname: '', msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: false });
    }
}

function organizeLogs(post, mySocketId = null) {
    const data = {
        id: post._id || post.id, // _idがなければidを使う
        createdAt: post.createdAt,
        nickname: post.nickname,
        msg: post.msg,
        positive: post.positive ? post.positive.length : 0,
        negative: post.negative ? post.negative.length : 0,
        isPositive: mySocketId ? post.positive?.some(p => p.userSocketId === mySocketId) : false,
        isNegative: mySocketId ? post.negative?.some(n => n.userSocketId === mySocketId) : false,
    };
    return data;
}

module.exports = { saveUser, getUserInfo, getPastLogs, organizeCreatedAt, SaveChatMessage, findPost, fetchPosts, fetchPosts_everybody };
