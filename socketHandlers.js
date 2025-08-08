const { 
  saveUser, 
  getPastLogs, 
  getPostsByDisplayOrder,
  SaveChatMessage,
  processPostReaction,
  addDocRow,
  updatePostData,
  updateDisplayOrder,
  deleteDocRow,
  updateRoomStats,
  getActiveRooms,
  getRoomHistory,
  explainRoomQuery,
  saveLog
} = require('./dbOperation');

const { 
  calculateDisplayOrderBetween,
  calculateDisplayOrder,
  calculateInsertOrder,
  addHeightMemory,
  unlockRowByPostId,
  calculateNewDisplayOrder
} = require('./socketUtils');

const { SOCKET_EVENTS } = require('./constants');

// グローバル変数
const userSockets = new Map();
const lockedRows = new Map();
const rooms = new Map();
const userRooms = new Map();
const heightMemory = [];

function initializeSocketHandlers(io) {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log('a user connected', socket.id);

    // ログインハンドラー
    socket.on(SOCKET_EVENTS.LOGIN, async (userInfo) => {
      await handleLogin(socket, userInfo, io);
    });

    // その他のイベントハンドラー
    setupChatHandlers(socket, io);
    setupReactionHandlers(socket, io);
    setupDocHandlers(socket, io);
    setupRoomHandlers(socket, io);
    setupLockHandlers(socket, io);
    setupLogHandlers(socket, io);
  });
}

async function handleLogin(socket, userInfo, io) {
  const { nickname, status, ageGroup } = userInfo;
  console.log('login:', nickname, status, ageGroup, socket.id);

  try {
    if (!nickname || !status || !ageGroup) {
      console.error('Invalid user info:', userInfo);
      return;
    }

    const newUser = await saveUser(nickname, status, ageGroup, socket.id);
    console.log('newUser:', newUser);

    socket.userId = newUser._id.toString();
    socket.nickname = nickname;
    userSockets.set(socket.userId, socket);

    socket.emit('connect OK', newUser);

    // 履歴取得ハンドラー
    socket.on(SOCKET_EVENTS.FETCH_HISTORY, async () => {
      try {
        const messages = await getPastLogs(nickname);
        socket.emit('history', messages);
      } catch (e) { console.error(e); }
    });

    socket.on(SOCKET_EVENTS.FETCH_DOCS, async () => {
      try {
        const docs = await getPostsByDisplayOrder();
        socket.emit('docs', docs);
      } catch (e) { console.error(e); }
    });

  } catch (e) { console.error(e); }
}

function setupChatHandlers(socket, io) {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ nickname, message, userId, roomId }) => {
    try {
      // displayOrderを計算
      const displayOrder = await getNextDisplayOrder();

      // チャットメッセージをDBに保存（ルーム情報も含める）
      const messageData = {
        nickname,
        message,
        userId,
        displayOrder,
        ...(roomId && { roomId })
      };

      const p = await SaveChatMessage(messageData);

      // ルームメッセージの場合は、Socket.IOルーム機能で効率的に配信
      if (roomId && rooms.has(roomId)) {
        console.log(`🏠 [server] Socket.IO ルーム room-${roomId} にメッセージ送信`);

        // Socket.IOのルーム機能を使用して、該当ルームの全参加者に即座に送信
        const responseData = { ...p, roomId };
        io.to(`room-${roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, responseData);

        // ルーム統計をデータベースで更新
        await updateRoomStats(roomId, {
          $inc: { messageCount: 1 }
        });

        console.log(`⚡ [server] Socket.IO ルーム配信完了: room-${roomId}`);
      }

      // --- ログ記録 ---
      saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder, roomId } });
    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.HEIGHT_CHANGE, (height) => {
    const heightArray = addHeightMemory(heightMemory, socket.id, height);
    io.emit(SOCKET_EVENTS.HEIGHT_CHANGE, heightArray);
  });
}

async function getNextDisplayOrder() {
  try {
    const posts = await getPostsByDisplayOrder();
    const lastPost = posts[posts.length - 1];
    return lastPost ? lastPost.displayOrder + 1 : 1;
  } catch (error) {
    throw error;
  }
}

function setupReactionHandlers(socket, io) {
  // positive/negativeリアクションの共通ハンドラー
  const reactionTypes = [SOCKET_EVENTS.POSITIVE, SOCKET_EVENTS.NEGATIVE];
  
  reactionTypes.forEach(reactionType => {
    socket.on(reactionType, async ({ postId, userSocketId, nickname }) => {
      try {
        console.log(`→${reactionType} reaction received:`, { postId, userSocketId, nickname });

        const processedData = await processPostReaction(postId, userSocketId, nickname, reactionType);
        console.log(`←${reactionType} reaction processed:`, processedData);

        const broadcastData = 
          reactionType === SOCKET_EVENTS.POSITIVE
            ? { id: processedData.id, positive: processedData.reaction, userHasVotedPositive: processedData.userHasReacted }
            : { id: processedData.id, negative: processedData.reaction, userHasVotedNegative: processedData.userHasReacted };

        io.emit(reactionType, broadcastData);

        saveLog({ userId: processedData.userId, action: reactionType, detail: { postId, userSocketId, nickname } });

      } catch (e) { console.error(e); }
    });
  });
}

function setupDocHandlers(socket, io) {
  socket.on(SOCKET_EVENTS.DOC_ADD, async (payload) => {
    try {
      let displayOrder = payload.displayOrder;
      const posts = await getPostsByDisplayOrder();

      // payload.displayOrderが指定されている場合はそれを優先
      if (displayOrder === undefined || !Number.isFinite(displayOrder)) {
        displayOrder = calculateInsertOrder(displayOrder, posts, payload);
      }

      // 最終チェック: NaNや不正値なら最大+1または1
      if (!Number.isFinite(displayOrder)) {
        displayOrder = posts.length > 0 ? posts[posts.length - 1].displayOrder + 1 : 1;
      }

      // DB保存
      const newPost = await addDocRow({
        nickname: payload.nickname,
        msg: payload.msg || '',
        displayOrder: calculateDisplayOrder(displayOrder, posts),
      });

      // 全クライアントに新規行追加をブロードキャスト
      const data = {
        id: newPost.id,
        nickname: newPost.nickname,
        msg: newPost.msg,
        displayOrder: newPost.displayOrder
      };

      io.emit(SOCKET_EVENTS.DOC_ADD, data);
      saveLog({ userId: newPost.userId, action: 'doc-add', detail: data });
    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_EDIT, async (payload) => {
    try {
      console.log('doc-edit:', payload);

      if (!payload.id) {
        io.emit(SOCKET_EVENTS.DOC_EDIT, payload);
        return;
      }

      const updatedPost = await updatePostData(payload);

      // updatedAtをpayloadに追加してemit
      io.emit(SOCKET_EVENTS.DOC_EDIT, { ...payload, updatedAt: updatedPost.updatedAt });

      // 編集完了時にロック解除
      unlockRowByPostId(lockedRows, io, payload.id);

      saveLog({ userId: null, action: 'doc-edit', detail: payload });
    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_REORDER, async (payload) => {
    try {
      const {
        nickname,
        movedPostId,
        movedPostDisplayOrder,
        beforePostDisplayOrder,
        afterPostDisplayOrder
      } = payload;

      // beforeとafter から新しいdisplayOrderを計算
      const newDisplayOrder = calculateNewDisplayOrder(
        beforePostDisplayOrder,
        afterPostDisplayOrder
      );

      // DB更新
      await updateDisplayOrder(movedPostId, newDisplayOrder);

      // 全クライアントに並び替えをブロードキャスト
      const posts = await getPostsByDisplayOrder(movedPostDisplayOrder);

      // 並び替え情報に実行者の情報を含めて送信
      io.emit(SOCKET_EVENTS.DOC_REORDER, {
        posts: posts,
        reorderInfo: {
          movedPostId: movedPostId,
          executorNickname: nickname
        }
      });

      // 並び替え完了時にロック解除
      unlockRowByPostId(lockedRows, io, movedPostId);

      saveLog({ userId: null, userNickname: nickname, action: 'doc-reorder', detail: payload });
    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_DELETE, async (payload) => {
    try {
      const deleted = await deleteDocRow(payload.id);

      if (deleted) {
        io.emit(SOCKET_EVENTS.DOC_DELETE, { id: payload.id });
        saveLog({ userId: null, action: 'doc-delete', detail: payload });
      }

    } catch (e) { console.error(e); }
  });
}

function setupLockHandlers(socket, io) {
  socket.on(SOCKET_EVENTS.DEMAND_LOCK, async (data) => {
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

function setupRoomHandlers(socket, io) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomId, userId, nickname, userInfo }) => {
    try {
      console.log(`🚀 [server] ルーム参加要求: ${nickname} -> ${roomId}`);

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
        console.log(`🚪 [server] Socket.IO ルーム退出: ${socket.currentSocketRoom}`);
      }

      const socketRoomName = `room-${roomId}`;
      socket.join(socketRoomName);
      socket.currentSocketRoom = socketRoomName;
      console.log(`🚀 [server] Socket.IO ルーム参加: ${socketRoomName}`);

      // 参加成功をクライアントに通知
      socket.emit('room-joined', {
        roomId,
        roomInfo: {
          name: room.name,
          description: room.description,
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
        socket.emit('room-error', { error: 'Room not found', roomId, message: 'ルームが見つかりません' });
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
  socket.on('get-room-list', async () => {
    try {
      console.log('📋 [server] ルーム一覧要求');

      const dbRooms = await getActiveRooms();

      const roomList = dbRooms.map(dbRoom => {
        const memoryRoom = rooms.get(dbRoom.id);
        return {
          id: dbRoom.id,
          name: dbRoom.name,
          description: dbRoom.description,
          participantCount: memoryRoom ? memoryRoom.participants.size : 0,
          messageCount: dbRoom.messageCount || 0,
          lastActivity: dbRoom.lastActivity,
          createdAt: dbRoom.createdAt,
          isPrivate: dbRoom.isPrivate,
          settings: dbRoom.settings
        };
      });

      socket.emit('room-list', { rooms: roomList });

      console.log(`✅ [server] ルーム一覧送信 (${roomList.length}件)`);

    } catch (error) {
      console.error('Error in get-room-list:', error);
      socket.emit('room-error', { error: error.message, message: 'ルーム一覧取得中にエラーが発生しました' });
    }
  });

  socket.on('fetch-room-history', async ({ roomId }) => {
    try {
      console.log(`📚 [server] ${roomId} の履歴要求`);

      if (!roomId) {
        socket.emit('room-error', { error: 'Room ID required', message: 'ルームIDが指定されていません' });
        return;
      }

      const messages = await getRoomHistory(roomId, 50);

      socket.emit('room-history', {
        roomId,
        messages: messages
      });

      console.log(`✅ [server] ${roomId} 履歴送信完了 (${messages.length}件)`);

      if (process.env.NODE_ENV === 'development') {
        await explainRoomQuery(roomId);
      }

    } catch (error) {
      console.error('Error fetching room history:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム履歴取得中にエラーが発生しました' });
    }
  });
}

function setupLogHandlers(socket, io) {
  socket.on('log', (log) => {
    saveLog(log);
  });
}

module.exports = {
  initializeSocketHandlers,
  userSockets,
  lockedRows,
  rooms,
  userRooms,
  heightMemory
};
