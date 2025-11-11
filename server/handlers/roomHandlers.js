const {
  getActiveRooms,
  getActiveRoomsBySpaceId,
  getRoomHistory,
  explainRoomQuery,
  saveLog
} = require('../dbOperation');

const { setUserCurrentRoom, setUserOffline, getRoomParticipantCount } = require('../db/userOperations'); // 新しい関数をインポート

const { SOCKET_EVENTS } = require('../constants');

function setupRoomHandlers(socket, io, rooms, userRooms, userSockets) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomId, userId, nickname, userInfo }) => {
    try {

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

      // 新機能: DBのUser.currentRoomを更新
      await setUserCurrentRoom(userId, roomId);

      // Socket.IOのルーム機能を使用
      if (socket.currentSocketRoom) {
        socket.leave(socket.currentSocketRoom);
      }

      const socketRoomName = `room-${roomId}`;
      socket.join(socketRoomName);
      socket.currentSocketRoom = socketRoomName;

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

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async ({ roomId, userId, nickname }) => {
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

      // 新機能: DBのUser.currentRoomをクリア
      await setUserCurrentRoom(userId, null);

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
  // 新スキーマに完全移行: roomConfig (Space), stats (Room) を用いたレスポンスを返す
  socket.on('get-room-list', async (data) => {
    try {
      const { spaceId } = data || {};

      if (spaceId === undefined || spaceId === null) {
        socket.emit('room-error', { error: 'Space ID required', message: 'スペースIDが指定されていません' });
        return;
      }

      // DBからルーム一覧を取得（新スキーマ: stats）
      const dbRooms = await getActiveRoomsBySpaceId(spaceId);
      console.log(`🏠 [server] スペース ${spaceId} のルーム取得: ${dbRooms.length}件`);

      // スペース情報は新スキーマの roomConfig を返す
      const { Space } = require('../db');
      const space = await Space.findOne({ id: spaceId }).lean();
      const spaceInfo = space ? {
        id: space.id,
        name: space.name,
        roomConfig: space.roomConfig || { mode: 'single', rooms: [{ name: '全体', isDefault: true }] }
      } : null;

      // ルームごとの参加者数はDB集計を利用（in-memory の participants ではなく信頼できるDBから取得）
      const roomListPromises = dbRooms.map(async (dbRoom) => {
        // getRoomParticipantCount は User コレクションを参照してオンライン人数をカウントする
        const participantCount = await getRoomParticipantCount(dbRoom.spaceId, dbRoom.id);

        return {
          id: dbRoom.id,
          name: dbRoom.name,
          spaceId: dbRoom.spaceId,
          participantCount,
          // 新スキーマの stats を優先して値を返す
          messageCount: dbRoom.stats?.messageCount || 0,
          lastActivity: dbRoom.stats?.lastActivity || dbRoom.createdAt,
          createdAt: dbRoom.createdAt,
          // 旧 settings は廃止。新しい設計意図を明示するために roomConfig 側で表現する。
          // 注意: ここでは部屋固有設定は返さない（シンプル化のため）
        };
      });

      const roomList = await Promise.all(roomListPromises);

      // スペース情報も含めて送信
      socket.emit('room-list', {
        rooms: roomList,
        spaceId,
        spaceInfo
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

      const messages = await getRoomHistory(roomId, 50);

      socket.emit('room-history', { roomId, messages });

    } catch (error) {
      console.error('Error fetching room history:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム履歴取得中にエラーが発生しました' });
    }
  });

  // 新機能: ディスコネクト時の処理
  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId;
      const nickname = socket.nickname;
      const roomId = socket.roomId;

      if (userId) {
        console.log(`🔌 [server] ユーザー切断: ${nickname} (${userId})`);

        // ユーザーをオフライン状態に設定
        await setUserOffline(userId);

        // ルームから退出
        if (roomId && rooms.has(roomId)) {
          const room = rooms.get(roomId);
          room.participants.delete(userId);
          userRooms.delete(userId);

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

          console.log(`👋 [server] ${nickname} が ${roomId} から切断により退出 (参加者数: ${room.participants.size})`);
        }

        // userSocketsから削除
        userSockets.delete(userId);
      }

    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });
}

module.exports = {
  setupRoomHandlers
};
