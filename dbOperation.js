// dbOperations.js
const { mongoose, User, Post } = require('./db');
const { handleErrors, organizeLogs } = require('./utils');

// ユーザーモデルに保存
async function saveUser(name, socketId) { // socketId は配列で保存
    try {
        const userData = { name, socketId };
        const newUser = await User.create(userData);
        return newUser;
    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
    }
}

// ユーザー情報を取得
async function getUserInfo(name) { // name 検索(何に使うか未定)
    try {
        const userInfo = await User.findOne().where('name').equals(name);
        return userInfo;
    } catch {
        handleErrors(error, 'ユーザー情報取得時にエラーが発生しました');
    }
}

// ログイン時・過去ログをDBから取得
async function getPastLogs(name) {
    try {
        let posts = await Post.find({});
        const pastLogs = await processXlogs(posts, name);
        return pastLogs;
    } catch (error) {
        handleErrors(error, 'getPastLogs 過去ログ取得中にエラーが発生しました');
    }
}

async function processXlogs(xLogs, name) {
    // const xLogs = await Promise.all(xLogs.map(organizeLogs));
    const result = [];
    xLogs.forEach(e => {
        e.createdAt = e.createdAt;
        if (e.stars > 0) {
            e.stars.forEach(e => {
                e.isBookmarked = e.name === name ? true : false;
            });
        }
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
async function saveRecord(name, msg) {
    try {
        const stars = [];

        const npData = { name, msg, stars };
        const newPost = await Post.create(npData);
        return newPost;
    } catch (error) {
        handleErrors(error, 'データ保存時にエラーが発生しました');
    }
}

// チャットメッセージ受送信
async function SaveChatMessage(name, msg) {
    try {
        const record = await saveRecord(name, msg);
        console.log('チャット保存しました💬:' + record.msg + record.createdAt);
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
            console.log(`findPost (attempt ${attempt}): `, msgId);
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
async function fetchPosts(name) {

    // まずユーザー情報のDBから、nameTomatchを取得
    const nameToMatch = await getUserInfo(name);

    if (!nameToMatch) {
        console.error('ユーザー情報が見つかりませんでした:', name);
        return null; // ユーザー情報が見つからない場合は null を返す
    }

    try {
        const messages = [];

        const posts = await Post.find({ 'stars': { '$elemMatch': { 'name': nameToMatch } } });
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
            // console.log('fetchPosts_everybody posts:', e.stars.length, e.childPostIds.length);
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
        messages.push({ name: e.name, msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: wasRocketed });

    } else {
        messages.push({ name: '', msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: false });
    }
}

module.exports = { saveUser, getUserInfo, getPastLogs, organizeCreatedAt, SaveChatMessage, findPost, fetchPosts, fetchPosts_everybody };
