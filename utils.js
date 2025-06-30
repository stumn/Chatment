// utils.js = index.js と dbOperations.js で使う関数のうち、
// socket.io やDBに直接関連しない部分の関数をまとめている

// [共通] エラーをコンソールに出力する関数(consoleが無限に増えないので見やすい)
function handleErrors(error, customMsg = '') {
    console.error(customMsg, error);
    throw error;
}

// --dbOperations.js で使う post を整える 関数--
function organizeLogs(post) {
    const data = {
        id: post._id,
        createdAt: post.createdAt,
        
        nickname: post.nickname,
        msg: post.msg,
        stars: post.stars.length,

        // 重ねる機能
        // parentPostId: post.parentPostId,
        // childPostIds: post.childPostIds,
    };
    return data;
}

//　--以下、index.js で使う関数--

// ユーザーのイベント状況を確認
async function checkEventStatus(events, userSocketId) {
    let isAlert = false;
    if (events.length > 0) {
        const existingUser = events.find(obj => obj.userSocketId === userSocketId);
        if (existingUser) { isAlert = true; }
    }
    return isAlert;
}

module.exports = { handleErrors, organizeLogs, checkEventStatus };