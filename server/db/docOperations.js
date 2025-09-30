// docOperations.js
const { Post } = require('../db');
const { handleErrors } = require('../utils');
const { organizeLogs, processXlogs } = require('./userOperations');

// --- displayOrder順で全Postを取得（スペース別） ---
async function getPostsByDisplayOrder(spaceId = null) {
    try {
        // スペース指定がある場合はそのスペースのドキュメントのみ取得
        const query = spaceId ? { spaceId } : {};
        
        const posts = await Post.find(query).sort({ displayOrder: 1 });
        return processXlogs(posts);
    } catch (error) {
        handleErrors(error, 'displayOrder順でのPost取得中にエラーが発生しました');
    }
}

// --- 新規行追加 ---
async function addDocRow({ nickname, msg = '', displayOrder, spaceId }) {
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
            spaceId, // spaceIdを追加
            source: 'document', // ドキュメントソースを明示的に指定
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
    getPostsByDisplayOrder,
    addDocRow,
    updateDisplayOrder,
    deleteDocRow
};
