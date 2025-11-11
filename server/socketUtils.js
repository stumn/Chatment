// 挿入・並び替え時の前後投稿のdisplayOrderを特定する
function detectInsertPosition(prevDisplayOrder, posts) {

    // displayOrderが今回挿入したい新規行の1つ上
    const prev = prevDisplayOrder;

    // displayOrderが今回挿入したい新規行の1つ下
    const next = posts.find(p => p.displayOrder > prevDisplayOrder);

    return calculateDisplayOrder(prev, next ? next.displayOrder : null);
}

// prev, next から displayOrder 計算
function calculateDisplayOrder(prevOrder, nextOrder) {

    // 前後の投稿が存在する場合、平均値を取る
    if (prevOrder !== null && prevOrder !== undefined && nextOrder !== null && nextOrder !== undefined) {
        return (prevOrder + nextOrder) / 2;
    }

    // 前の投稿が存在する場合、次の投稿の前に挿入
    if (prevOrder !== null && prevOrder !== undefined) {
        return prevOrder + 1;
    }

    // 次の投稿が存在する場合、次の投稿の前に挿入
    if (nextOrder !== null && nextOrder !== undefined) {
        return nextOrder - 1;
    }

    // どちらも存在しない場合は1を返す
    return 1;
}

// 高さメモリ管理
function addHeightMemory(heightMemory, id, height) {
    const index = heightMemory.findIndex(item => item.id === id);
    index !== -1
        ? heightMemory[index].height = height
        : heightMemory.push({ id, height });
    return heightMemory.map(item => item.height); // 高さを全て返す
}

// ロック管理関連の関数
function unlockRowByPostId(lockedRows, io, postId) {
    for (const [rowElementId, lockInfo] of lockedRows.entries()) {
        // rowElementIdにpostIdが含まれているかチェック
        if (rowElementId.includes(postId)) {
            lockedRows.delete(rowElementId);

            // 全クライアントにロック解除をブロードキャスト
            io.emit('row-unlocked', { id: rowElementId, postId });
            break;
        }
    }
}

module.exports = {
    calculateDisplayOrder,
    detectInsertPosition,
    addHeightMemory,
    unlockRowByPostId
};
