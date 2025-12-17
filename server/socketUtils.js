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
function addHeightMemory(heightMemory, id, height, spaceId) {
    const index = heightMemory.findIndex(item => item.id === id);
    if (index !== -1) {
        heightMemory[index].height = height;
        heightMemory[index].spaceId = spaceId;
    } else {
        heightMemory.push({ id, height, spaceId });
    }
    // オブジェクト全体を返す（height, spaceIdを含む）
    return heightMemory.map(item => ({ height: item.height, spaceId: item.spaceId }));
}

// 高さメモリから削除
function removeHeightMemory(heightMemory, id) {
    const index = heightMemory.findIndex(item => item.id === id);
    if (index !== -1) {
        heightMemory.splice(index, 1);
    }
    return heightMemory.map(item => ({ height: item.height, spaceId: item.spaceId }));
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

// 特定のsocketIdが保持している全てのロックを解放
function unlockAllBySocketId(lockedRows, io, socketId) {
    const unlockedRows = [];
    
    for (const [rowElementId, lockInfo] of lockedRows.entries()) {
        if (lockInfo.socketId === socketId) {
            lockedRows.delete(rowElementId);
            unlockedRows.push({ id: rowElementId });
        }
    }

    // 解放された行を全クライアントに通知
    unlockedRows.forEach(row => {
        io.emit('row-unlocked', row);
    });

    return unlockedRows.length;
}

module.exports = {
    calculateDisplayOrder,
    detectInsertPosition,
    addHeightMemory,
    removeHeightMemory,
    unlockRowByPostId,
    unlockAllBySocketId
};
