// postOperations.js
const { mongoose, User, Post, Log, Room } = require('../db');
const { handleErrors } = require('../utils');
const { organizeLogs } = require('./userOperations');

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

//  --- Doc 行編集 ---
async function updatePostData(payload) {
    const updateObj = { msg: payload.newMsg };
    if (payload.nickname) updateObj.nickname = payload.nickname;
    updateObj.updatedAt = new Date();

    const updatedPost = await Post.findByIdAndUpdate(payload.id, updateObj, { new: true });
    return updatedPost;
}

module.exports = {
    saveRecord,
    SaveChatMessage,
    processPostReaction,
    updatePostData
};
