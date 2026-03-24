const {
  getActiveRooms,
  getActiveRoomsBySpaceId,
  getRoomHistory,
  explainRoomQuery,
  saveLog
} = require('../dbOperation');

function setupRoomHandlers(socket, io, rooms, userRooms, userSockets) {

  socket.on('join-space', ({ roomId, userId, nickname, userInfo }) => {
    try {
      // ルームの存在確認
      if (rooms.size === 0) {

        // ログ記録 - スペース参加エラー
        saveLog({
          userId,
          userNickname: nickname,
          action: 'space-join-error',
          detail: { error: 'No rooms available', nickname },
          spaceId: userInfo?.spaceId,
          level: 'error',
          source: 'server'
        });

        socket.emit('space-error', { error: 'No rooms available', message: '利用可能なスペースがありません' });
        return;
      }

      // roomIdがない場合
      if (!rooms.has(roomId)) {

        // ログ記録 - ルーム参加エラー
        saveLog({
          userId,
          userNickname: nickname,
          action: 'space-join-error',
          detail: { error: 'Room not found', roomId, nickname },
          spaceId: userInfo?.spaceId,
          level: 'error',
          source: 'server'
        });

        socket.emit('space-error', { error: 'Room not found', roomId, message: 'スペースが見つかりません' });
        return;
      }

      // 現在のルームから退出（もしあれば）
      const currentRoomId = userRooms.get(userId);
      if (currentRoomId && rooms.has(currentRoomId)) {
        const currentRoom = rooms.get(currentRoomId);
        currentRoom.participants.delete(userId);

        currentRoom.participants.forEach(participantUserId => {
          const participantSocket = userSockets.get(participantUserId);
          if (participantSocket) {
            participantSocket.emit('other-user-left', {
              roomId: currentRoomId,
              userId,
              nickname,
              participantCount: currentRoom.participants.size
            });
          }
        });

        console.log(`👋 [server] ${nickname} が ${currentRoomId} から退出`);
      }

      // 新しいルームに参加
      const room = rooms.get(roomId);
      room.participants.add(userId);
      userRooms.set(userId, roomId);
      socket.userId = userId;
      socket.roomId = roomId;
      socket.nickname = nickname;

      // Socket.IOのルーム機能を使用
      if (socket.currentSocketRoom) {
        socket.leave(socket.currentSocketRoom);
      }

      // roomIdをそのままSocket.IOのルーム名として使用
      socket.join(roomId);
      socket.currentSocketRoom = roomId;

      // 参加成功をクライアントに通知
      socket.emit('space-joined', {
        roomId,
        roomInfo: {
          name: room.name,
          participantCount: room.participants.size
        }
      });

      // 他の参加者に新規参加を通知
      room.participants.forEach(participantUserId => {
        if (participantUserId !== userId) {
          const participantSocket = userSockets.get(participantUserId);
          if (participantSocket) {
            participantSocket.emit('other-user-joined', {
              roomId,
              userId,
              nickname,
              participantCount: room.participants.size
            });
          }
        }
      });

      // ログ記録 - スペース参加
      saveLog({
        userId,
        userNickname: nickname,
        action: 'join-space',
        detail: { roomId, nickname, participantCount: room.participants.size },
        spaceId: userInfo?.spaceId,
        level: 'info',
        source: 'server'
      });

    } catch (error) {
      console.error('Error in join-space:', error);
      socket.emit('space-error', { error: error.message, roomId, message: 'スペース参加中にエラーが発生しました' });
    }
  });

  socket.on('leave-space', ({ roomId, userId, nickname }) => {
    try {
      if (!rooms.has(roomId)) {
        // ルームが存在しない場合でも退出完了として扱う
        socket.emit('space-left', {
          roomId,
          participantCount: 0
        });
        userRooms.delete(userId);
        return;
      }

      const room = rooms.get(roomId);
      room.participants.delete(userId);
      userRooms.delete(userId);

      // Socket.IOルームからも退出
      if (socket.currentSocketRoom) {
        socket.leave(socket.currentSocketRoom);
        socket.currentSocketRoom = null;
      }

      socket.emit('space-left', {
        roomId,
        participantCount: room.participants.size
      });

      // 他の参加者に退出を通知
      room.participants.forEach(participantUserId => {
        const participantSocket = userSockets.get(participantUserId);
        if (participantSocket) {
          participantSocket.emit('other-user-left', {
            roomId,
            userId,
            nickname,
            participantCount: room.participants.size
          });
        }
      });

      // ログ記録 - スペース退出
      saveLog({
        userId,
        userNickname: nickname,
        action: 'leave-space',
        detail: { roomId, nickname, participantCount: room.participants.size },
        spaceId: userInfo?.spaceId,
        level: 'info',
        source: 'server'
      });

    } catch (error) {
      console.error('Error in leave-space:', error);
      socket.emit('space-error', { error: error.message, roomId, message: 'スペース退出中にエラーが発生しました' });
    }
  });

  // その他のルーム関連ハンドラー...
  socket.on('get-space-info', async (data) => {
    try {
      const { spaceId } = data || {};

      let dbRooms;
      let spaceInfo = null;

      if (spaceId !== undefined && spaceId !== null) {
        dbRooms = await getActiveRoomsBySpaceId(spaceId);

        // DBから取得したルームをメモリに登録
        dbRooms.forEach(dbRoom => {
          if (!rooms.has(dbRoom.id)) {
            rooms.set(dbRoom.id, {
              id: dbRoom.id,
              name: dbRoom.name,
              spaceId: dbRoom.spaceId,
              participants: new Set(),
              settings: dbRoom.settings
            });
          }
        });

        // スペース情報も取得してサブルーム設定を含める
        const { Space } = require('../db');
        const space = await Space.findOne({ id: spaceId }).lean();
        if (space) {
          spaceInfo = {
            id: space.id,
            name: space.name,
            settings: {
              subRoomSettings: space.settings?.subRoomSettings || {
                enabled: false,
                rooms: [{ name: '全体' }]
              }
            }
          };
        }
      }

      const roomList = dbRooms.map(dbRoom => {
        const memoryRoom = rooms.get(dbRoom.id);
        return {
          id: dbRoom.id,
          name: dbRoom.name,
          spaceId: dbRoom.spaceId, // spaceIdを含める
          participantCount: memoryRoom ? memoryRoom.participants.size : 0,
          messageCount: dbRoom.messageCount || 0,
          lastActivity: dbRoom.lastActivity,
          createdAt: dbRoom.createdAt,
          settings: dbRoom.settings
        };
      });

      // スペース情報も含めて送信
      socket.emit('space-info', {
        rooms: roomList,
        spaceId,
        spaceInfo: spaceInfo
      });

      // ログ記録 - スペース情報取得
      saveLog({
        userId: socket.userId,
        userNickname: socket.nickname,
        action: 'get-space-info',
        detail: { spaceId, roomCount: roomList.length },
        spaceId,
        level: 'info',
        source: 'server'
      });

    } catch (error) {
      console.error('Error in get-space-info:', error);
      socket.emit('space-error', { error: error.message, message: 'スペース情報取得中にエラーが発生しました' });
    }
  });

  socket.on('fetch-space-history', async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit('space-error', { error: 'Room ID required', message: 'ルームIDが指定されていません' });
        return;
      }

      // spaceIdはroomIdから自動抽出されるので、第2引数は不要
      const messages = await getRoomHistory(roomId);

      socket.emit('space-history', { roomId, messages });

      // ログ記録 - スペース履歴取得
      const spaceId = roomId.match(/space(\d+)-/)?.[1];
      saveLog({
        userId: socket.userId,
        userNickname: socket.nickname,
        action: 'fetch-space-history',
        detail: { roomId, messageCount: messages.length },
        spaceId: spaceId ? parseInt(spaceId) : null,
        level: 'info',
        source: 'server'
      });

    } catch (error) {
      console.error('Error fetching space history:', error);
      socket.emit('space-error', { error: error.message, roomId, message: 'スペース履歴取得中にエラーが発生しました' });
    }
  });
}

module.exports = {
  setupRoomHandlers
};
