// userOperations.js
const { User, Post } = require('../db');
const { handleErrors } = require('../utils');

// --- ユーザーモデルに保存(socketId: Array<string>) ---
async function saveUser(nickname, status, ageGroup, socketId) {
    try {

        const userData = { nickname, status, ageGroup, socketId };

        const newUser = await User.create(userData);

        return newUser;

    } catch (error) {
        handleErrors(error, 'ユーザー保存時にエラーが発生しました');
    }
}

// --- ログイン時・過去ログをDBから取得（ルーム機能を使うときは使われない） ---
async function getPastLogs(nickname) {
    try {

        // 過去ログを取得
        let posts = await Post.find({});

        // 過去ログを整形
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

module.exports = {
    saveUser,
    getPastLogs,
    processXlogs,
    organizeCreatedAt,
    organizeLogs
};
