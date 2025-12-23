function setupLockHandlers(socket, io, lockedRows) {
  // ロックタイムアウトの設定（5分 = 300000ms）
  const LOCK_TIMEOUT = 5 * 60 * 1000;

  socket.on('demand-lock', async (data) => {
    try {
      console.log('demand-lock received:', data);

      if (data.rowElementId && data.nickname) {
        if (lockedRows.has(data.rowElementId)) {
          const existingLock = lockedRows.get(data.rowElementId);
          const lockAge = Date.now() - existingLock.timestamp;

          // タイムアウトチェック：既存のロックが5分以上経過している場合は強制解除
          if (lockAge > LOCK_TIMEOUT) {
            console.warn(`⏰ Lock timeout: ${data.rowElementId} (locked by ${existingLock.nickname} for ${Math.floor(lockAge / 1000)}s)`);
            lockedRows.delete(data.rowElementId);
            // 古いロックを解除通知
            io.emit('row-unlocked', { id: data.rowElementId, postId: existingLock.postId });
            // ロック取得を続行
          } else {
            console.log('Row is already locked:', data.rowElementId);
            socket.emit('Lock-not-allowed', { id: data.rowElementId, message: 'Row is already locked' });
            return;
          }
        }

        // rowElementIdからpostIdを抽出（形式: dc-index-displayOrder-postId）
        const postId = data.rowElementId.split('-').pop();

        // ロックを許可
        lockedRows.set(data.rowElementId, {
          nickname: data.nickname,
          userId: data.userId,
          socketId: socket.id,
          postId: postId,
          timestamp: Date.now()
        });
        console.log('Row locked:', data.rowElementId, 'by', data.nickname);

        socket.emit('Lock-permitted', { id: data.rowElementId, nickname: data.nickname });
        socket.broadcast.emit('row-locked', { id: data.rowElementId, nickname: data.nickname });
      }
    } catch (e) { console.error('Error in demand-lock:', e); }
  });

  socket.on('unlock-row', (data) => {
    try {
      console.log('unlock-row received:', data);

      if (data.rowElementId && lockedRows.has(data.rowElementId)) {
        const lockInfo = lockedRows.get(data.rowElementId);
        console.log('Unlocking row:', data.rowElementId, 'previously locked by:', lockInfo.nickname);

        lockedRows.delete(data.rowElementId);
        io.emit('row-unlocked', { id: data.rowElementId, postId: data.postId });
      } else if (data.rowElementId && !lockedRows.has(data.rowElementId)) {
        console.warn('Unlock attempted for non-locked row:', data.rowElementId);
      }
    } catch (e) { console.error('Error in unlock-row:', e); }
  });

  // デバッグ用: 現在のロック状態を取得
  socket.on('get-lock-status', () => {
    try {
      const lockStatus = Array.from(lockedRows.entries()).map(([rowElementId, lockInfo]) => ({
        rowElementId,
        ...lockInfo
      }));
      socket.emit('lock-status', { locks: lockStatus, count: lockStatus.length });
    } catch (e) { console.error('Error in get-lock-status:', e); }
  });
}

module.exports = {
  setupLockHandlers
};
