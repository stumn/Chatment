function setupLockHandlers(socket, io, lockedRows) {
  socket.on('demand-lock', async (data) => {
    try {
      console.log('demand-lock received:', data);

      if (data.rowElementId && data.nickname) {
        if (lockedRows.has(data.rowElementId)) {
          console.log('Row is already locked:', data.rowElementId);
          socket.emit('Lock-not-allowed', { id: data.rowElementId, message: 'Row is already locked' });
        } else {
          // ロックを許可
          lockedRows.set(data.rowElementId, {
            nickname: data.nickname,
            userId: data.userId,
            socketId: socket.id
          });
          console.log('Row locked:', data.rowElementId, 'by', data.nickname);

          socket.emit('Lock-permitted', { id: data.rowElementId, nickname: data.nickname });
          socket.broadcast.emit('row-locked', { id: data.rowElementId, nickname: data.nickname });
        }
      }
    } catch (e) { console.error(e); }
  });

  socket.on('unlock-row', (data) => {
    try {
      console.log('unlock-row received:', data);

      if (data.rowElementId && lockedRows.has(data.rowElementId)) {
        const lockInfo = lockedRows.get(data.rowElementId);
        console.log('Unlocking row:', data.rowElementId, 'previously locked by:', lockInfo.nickname);

        lockedRows.delete(data.rowElementId);
        io.emit('row-unlocked', { id: data.rowElementId, postId: data.postId });
      }
    } catch (e) { console.error(e); }
  });
}

module.exports = {
  setupLockHandlers
};
