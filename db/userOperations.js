// userOperations.js
const { User, Post } = require('../db');
const { handleErrors } = require('../utils');

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
        handleErrors("無効な日時:", createdAt);
        return "Invalid Date";
    }
    return UTCdate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
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

module.exports = {
    saveUser,
    getPastLogs,
    processXlogs,
    organizeCreatedAt,
    organizeLogs
};
