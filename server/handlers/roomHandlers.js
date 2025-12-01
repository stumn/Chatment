const {
  getActiveRooms,
  getActiveRoomsBySpaceId,
  getRoomHistory,
  explainRoomQuery,
  saveLog
} = require('../dbOperation');

const { SOCKET_EVENTS } = require('../constants');

function setupRoomHandlers(socket, io, rooms, userRooms, userSockets) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomId, userId, nickname, userInfo }) => {
    try {
      console.log(`🚪 [roomHandlers] ルーム参加リクエスト受信:`, {
        roomId,
        userId,
        nickname,
        roomExists: rooms.has(roomId)
      });

      // ルームの存在確認
      // roomsがない場合

      // roomIdがない場合

      if (!rooms.has(roomId)) {
        socket.emit('room-error', { error: 'Room not found', roomId, message: 'ルームが見つかりません' });
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
            participantSocket.emit('user-left', {
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

      console.log(`🔌 [roomHandlers] Socket.IOルーム参加: ${roomId} (Socket ID: ${socket.id})`);

      // 参加成功をクライアントに通知
      socket.emit('room-joined', {
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
            participantSocket.emit('user-joined', {
              roomId,
              userId,
              nickname,
              participantCount: room.participants.size
            });
          }
        }
      });

      console.log(`✅ [server] ${nickname} が ${roomId} に参加 (参加者数: ${room.participants.size})`);

      saveLog({ userId, action: 'join-room', detail: { roomId, nickname, participantCount: room.participants.size } });

    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム参加中にエラーが発生しました' });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ roomId, userId, nickname }) => {
    try {
      console.log(`👋 [server] ルーム退出要求: ${nickname} -> ${roomId}`);

      if (!rooms.has(roomId)) {
        console.warn(`⚠️ [server] 退出要求されたルームが見つかりません（既に削除済み?）: ${roomId}`);
        // ルームが存在しない場合でも退出完了として扱う
        socket.emit('room-left', {
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
        console.log(`🚪 [server] Socket.IO ルーム退出: ${socket.currentSocketRoom}`);
        socket.currentSocketRoom = null;
      }

      socket.emit('room-left', {
        roomId,
        participantCount: room.participants.size
      });

      // 他の参加者に退出を通知
      room.participants.forEach(participantUserId => {
        const participantSocket = userSockets.get(participantUserId);
        if (participantSocket) {
          participantSocket.emit('user-left', {
            roomId,
            userId,
            nickname,
            participantCount: room.participants.size
          });
        }
      });

      console.log(`✅ [server] ${nickname} が ${roomId} から退出 (参加者数: ${room.participants.size})`);

      saveLog({ userId, action: 'leave-room', detail: { roomId, nickname, participantCount: room.participants.size } });

    } catch (error) {
      console.error('Error in leave-room:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム退出中にエラーが発生しました' });
    }
  });

  // その他のルーム関連ハンドラー...
  socket.on('get-room-list', async (data) => {
    try {
      const { spaceId } = data || {};

      let dbRooms;
      let spaceInfo = null;

      if (spaceId !== undefined && spaceId !== null) {
        dbRooms = await getActiveRoomsBySpaceId(spaceId);
        console.log(`🏠 [server] スペース ${spaceId} のルーム取得: ${dbRooms.length}件`);
        console.log(dbRooms);

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
      socket.emit('room-list', {
        rooms: roomList,
        spaceId,
        spaceInfo: spaceInfo
      });

    } catch (error) {
      console.error('Error in get-room-list:', error);
      socket.emit('room-error', { error: error.message, message: 'ルーム一覧取得中にエラーが発生しました' });
    }
  });

  socket.on('fetch-room-history', async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit('room-error', { error: 'Room ID required', message: 'ルームIDが指定されていません' });
        return;
      }

      // spaceIdはroomIdから自動抽出されるので、第2引数は不要
      /**
       * getRoomHistory(roomId)
       * @param {string} roomId - The ID of the room whose history is to be fetched.
       * @returns {Promise<Array>} - Resolves to an array of message objects for the room.
       * Note: spaceId is automatically extracted from roomId inside the function, so no second argument is needed.
       */
      const messages = await getRoomHistory(roomId);

      socket.emit('room-history', { roomId, messages });

    } catch (error) {
      console.error('Error fetching room history:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム履歴取得中にエラーが発生しました' });
    }
  });
}

module.exports = {
  setupRoomHandlers
};
