// dbOperations.js
const { mongoose, User, Post } = require('./db');
const { handleErrors, organizeLogs } = require('./utils');

// ユーザーモデルに保存
async function saveUser(name, socketId, randomString) {
    try {
        const userData = { name, socketId, randomString };
        const newUser = await User.create(userData);
        return newUser;
    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
    }
}

// ユーザー情報を取得
async function getUserInfo(name) {
    try {
        const userInfo = await User.findOne().where('name').equals(name);
        const randomString = userInfo.randomString;
        return randomString;
    } catch {
        handleErrors(error, 'ユーザー情報取得時にエラーが発生しました');
    }
}

// const PAST_POST = 10 // 過去ログ取得数

// ログイン時・過去ログをDBから取得
async function getPastLogs(name) {
    try {
        let memos = await Memo.find({ 'isBeingOpened': false, 'name': name });
        let posts = await Post.find({});
        let stacks = posts.filter(e => e.parentPostId !== null);

        posts = posts.filter(e => e.parentPostId === null);
        myPastArray = memos.concat(posts);
        myPastArray.sort((a, b) => a.createdAt - b.createdAt);

        const pastLogs = await processXlogs(myPastArray);
        const stackLogs = await processXlogs(stacks);
        return { pastLogs, stackLogs };
    } catch (error) {
        handleErrors(error, 'getPastLogs 過去ログ取得中にエラーが発生しました');
    }
}

async function processXlogs(xLogs, name) {
    // const xLogs = await Promise.all(xLogs.map(organizeLogs));
    const result = [];
    xLogs.forEach(e => {
        e.createdAt = e.createdAt;
        if (e.memoCreatedAt) { e.memoCreatedAt = e.memoCreatedAt; }
        if (e.bookmarks > 0) {
            e.bookmarks.forEach(e => {
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
async function saveRecord(name, msg, inqury = {}, stack = {}, memo = {}) {
    try {
        const { options = [], voters = [] } = inqury;
        const { parentPostId = null, childPostIds = [] } = stack;
        const { memoId = null, memoCreatedAt = null } = memo;
        const bookmarks = [];

        const npData = { name, msg, options, voters, bookmarks, parentPostId, childPostIds, memoId, memoCreatedAt };
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
async function fetchPosts(randomString) {
    // まずユーザー情報のDBから、nameTomatchを取得
    const nameToMatch = await getUserInfo_rsnm(randomString);
    if (nameToMatch) {
        try {
            // 配列を用意
            const messages = [];

            // チャットを取得・格納
            const posts = await Post.find({ 'bookmarks': { '$elemMatch': { 'name': nameToMatch } } });
            posts.forEach(e => organizeAndPush(messages, e));

            // memo を取得・格納
            const memos = await Memo.find({ name: nameToMatch });
            memos.forEach(e => organizeAndPush(messages, e, false));

            // createdAt でソート
            messages.sort((a, b) => a.createdAt - b.createdAt);

            return messages;
        }
        catch (error) {
            handleErrors(error, 'api 過去ログ取得中にエラーが発生しました');
        }
    }
}

async function fetchPosts_everybody() {
    try {
        // 配列を用意
        const messages = [];

        // チャットを取得
        const posts = await Post.find({
            $or: [
                { "bookmarks.1": { $exists: true } }, // bookmarks配列の長さが2以上
                { "childPostIds.0": { $exists: true } } // childPostIds配列の長さが1以上
            ]
        });

        // チャットを格納
        posts.forEach(e => {
            console.log('fetchPosts_everybody posts:', e.bookmarks.length, e.childPostIds.length);
        });
        posts.forEach(e => { organizeAndPush(messages, e); });

        // console.log('fetchPosts_everybody messages:', messages);
        return messages;
    } catch (error) {
        handleErrors(error, 'api 過去ログ取得中にエラーが発生しました');
    }
}

function organizeAndPush(messages, e, isChat = true) {
    if (isChat) {
        const wasRocketed = e.memoId ? true : false;
        console.log('chat -> e.memoId:', e, 'wasRocketed:', wasRocketed);
        messages.push({ name: e.name, msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: wasRocketed });

    } else {
        console.log('memo');
        messages.push({ name: '', msg: e.msg, createdAt: e.createdAt, id: e.id, wasRocketed: false });
    }
}

module.exports = { saveUser, getUserInfo, getPastLogs, organizeCreatedAt, SaveChatMessage, SavePersonalMemo, SaveSurveyMessage, SaveRevealMemo, SaveKasaneteMemo, findPost, findMemo, fetchPosts, fetchPosts_everybody, saveStackRelation, SaveParentPost };
