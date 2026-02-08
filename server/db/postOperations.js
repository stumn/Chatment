// postOperations.js
const { Post } = require('../db');
const { handleErrors } = require('../utils');
const { organizeLogs } = require('./userOperations');

// --- データベースにレコードを保存 ---
async function saveRecord(nickname, msg, userId, displayOrder, source = 'document', spaceId = 1, displayName = null) {
    try {
        // userIdが空文字列・null・undefined・不正なObjectIdの場合はundefinedにする
        let validUserId = userId;
        if (!userId || typeof userId !== 'string' || userId.trim() === '' || !userId.match(/^[a-fA-F0-9]{24}$/)) {
            validUserId = undefined;
        }

        // 新規投稿データの作成
        const npData = {
            nickname,
            msg,
            displayOrder: displayOrder || 0,
            spaceId, // スペースIDを追加
            source, // ソース情報を追加
            ...(validUserId && { userId: validUserId }),
            ...(displayName && { displayName }) // チャット用の表示名
        };

        // 新規投稿をデータベースに保存
        const newPost = await Post.create(npData);

        return newPost;

    } catch (error) {
        handleErrors(error, 'データ保存時にエラーが発生しました');
    }
}

// --- チャットメッセージ受送信 ---
async function SaveChatMessage({ nickname, displayName, message, userId, displayOrder = 0, spaceId = 1 }) {
    try {
        const record = await saveRecord(nickname, message, userId, displayOrder, 'chat', spaceId, displayName);
        return organizeLogs(record);
    } catch (error) {
        handleErrors(error, 'チャット受送信中にエラーが発生しました');
    }
}

//  --- positive, negative 用の関数 ---
async function processPostReaction(postId, userSocketId = null, nickname = '', reactionType) {

    // 受信したpostIdでPostを取得（Postが存在しない場合は終了）
    const post = await Post.findById(postId);
    if (!post) return;

    // 反応のインデックスを取得
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

    const updateObj = {
        msg: payload.newMsg,
        ...(payload.displayName && { displayName: payload.displayName })
    };

    // 受信したデータにニックネームがあれば更新
    if (payload.nickname) updateObj.nickname = payload.nickname;

    // 見出し行（#で始まる行）の場合、インデントレベルを0に設定
    if (payload.newMsg && payload.newMsg.startsWith('#')) {
        updateObj.indentLevel = 0;
    }

    // 更新日時を設定
    updateObj.updatedAt = new Date();

    // 更新処理を実行
    const updatedPost = await Post.findByIdAndUpdate(payload.id, updateObj, { new: true });

    return updatedPost;
}

module.exports = {
    saveRecord,
    SaveChatMessage,
    processPostReaction,
    updatePostData
};
