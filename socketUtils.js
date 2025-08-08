// displayOrder計算用のヘルパー関数
function calculateDisplayOrder(displayOrder, posts) {

    // displayOrderが今回挿入したい新規行の1つ上
    const prev = displayOrder;

    // displayOrderが今回挿入したい新規行の1つ下
    const next = posts.find(p => p.displayOrder > displayOrder);

    return calculateDisplayOrderBetween(prev, next ? next.displayOrder : null);
}

// displayOrder計算関連の関数
function calculateDisplayOrderBetween(prevOrder, nextOrder) {

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

// 挿入用displayOrder計算
function calculateInsertOrder(displayOrder, posts, payload) {
    // displayOrderが未指定の場合、挿入位置に基づいて計算
    if (posts.length === 0) {
        displayOrder = 1; // 投稿が一つもない場合は1
    }
    else if (payload.insertAfterId) { // 特定のIDの後に挿入する場合
        const targetPostIndex = posts.findIndex(p => p.id === payload.insertAfterId);

        if (targetPostIndex !== -1) {
            const prev = posts[targetPostIndex];
            const next = posts[targetPostIndex + 1];

            // 共通関数を使用
            displayOrder = calculateDisplayOrderBetween(
                prev.displayOrder,
                next ? next.displayOrder : null
            );
            
        } else {
            // 対象IDが見つからない場合は末尾に追加
            displayOrder = posts[posts.length - 1].displayOrder + 1;
        }
    } else { // insertAfterIdが指定されていない場合は末尾に追加
        displayOrder = posts[posts.length - 1].displayOrder + 1;
        console.log('insertAfterIdが指定されていないので、末尾に追加:', displayOrder);
    }
    return displayOrder;
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
            console.log('Unlocking row:', rowElementId, 'for post:', postId);
            lockedRows.delete(rowElementId);

            // 全クライアントにロック解除をブロードキャスト
            io.emit('row-unlocked', { id: rowElementId, postId });
            break;
        }
    }
}

module.exports = {
    calculateDisplayOrderBetween,
    calculateInsertOrder,
    calculateDisplayOrder,
    addHeightMemory,
    unlockRowByPostId
};
