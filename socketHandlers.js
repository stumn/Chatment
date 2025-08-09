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
  calculateDisplayOrder,
  detectInsertPosition,
  addHeightMemory,
  unlockRowByPostId,
} = require('./socketUtils');

const { SOCKET_EVENTS } = require('./constants');

// グローバル変数
const userSockets = new Map();
const lockedRows = new Map();
const rooms = new Map();
const userRooms = new Map();
const heightMemory = [];

// --- Socket.IOの初期化 ---
function initializeSocketHandlers(io) {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {

    console.log('a user connected', socket.id);

    // ログインハンドラー
    socket.on(SOCKET_EVENTS.LOGIN, async (userInfo) => {
      await handleLogin(socket, userInfo);
    });

    // その他のイベントハンドラー
    setupChatHandlers(socket, io);
    setupUIHandlers(socket, io);
    setupReactionHandlers(socket, io);
    setupDocHandlers(socket, io);
    setupRoomHandlers(socket, io);
    setupLockHandlers(socket, io);
    setupLogHandlers(socket, io);
  });
}

// --- ログインハンドラー ---
async function handleLogin(socket, userInfo) {
  const { nickname, status, ageGroup } = userInfo;
  console.log('🙋login:', nickname, status, ageGroup, socket.id);

  try {

    // nickname, status, ageGroupが必須
    if (!nickname || !status || !ageGroup) {
      console.error('Invalid user info:', userInfo);
      return;
    }

    // ユーザをDBへ保存（TODO: nickname, status, ageGroupが全く同じ場合、同じユーザとして扱うためのロジックを追加）
    const newUser = await saveUser(nickname, status, ageGroup, socket.id);

    // TODO: ちゃんと確認する
    socket.userId = newUser._id.toString();
    socket.nickname = nickname;
    userSockets.set(socket.userId, socket);

    // ユーザログインが成功したことを通知
    socket.emit('connect OK', newUser);

    // チャット履歴取得ハンドラー（過去チャットログ 但し、ルーム機能を使うときは使われない）
    socket.on(SOCKET_EVENTS.FETCH_HISTORY, async () => {
      try {
        const messages = await getPastLogs(nickname);
        socket.emit('history', messages);
      } catch (e) { console.error(e); }
    });

    // ドキュメント用取得ハンドラー
    socket.on(SOCKET_EVENTS.FETCH_DOCS, async () => {
      try {
        const docs = await getPostsByDisplayOrder();
        socket.emit('docs', docs);
      } catch (e) { console.error(e); }
    });

  } catch (e) { console.error(e); }
}

// --- チャットハンドラーのセットアップ ---
function setupChatHandlers(socket, io) {

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ nickname, message, userId, roomId }) => {
    try {
      // displayOrderの最後尾を取得
      const displayOrder = await getLastDisplayOrder();

      // チャットメッセージデータ（ルーム情報も含める）
      const messageData = {
        nickname,
        message,
        userId,
        displayOrder,
        ...(roomId && { roomId })
      };

      // DBにデータ保存
      const p = await SaveChatMessage(messageData);

      // ルームメッセージの場合は、Socket.IOルーム機能で効率的に配信
      if (roomId && rooms.has(roomId)) {

        console.log(`🏠 [server] Socket.IO ルーム room-${roomId} にメッセージ送信`);

        // Socket.IOのルーム機能により、該当ルームの全参加者に即座に送信
        const responseData = { ...p, roomId };
        io.to(`room-${roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, responseData);

        // ルーム統計をデータベースで更新
        await updateRoomStats(roomId, { $inc: { messageCount: 1 } });
      }

      // ログ記録
      saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder, roomId } });

    } catch (e) { console.error(e); }
  });
}

// --- UIハンドラーのセットアップ ---
function setupUIHandlers(socket, io) {

  socket.on(SOCKET_EVENTS.HEIGHT_CHANGE, (height) => {

    // 高さメモリに追加
    const heightArray = addHeightMemory(heightMemory, socket.id, height);

    // 高さメモリを全クライアントにブロードキャスト(TODO: 同じルームにいる人にだけ送信するのか検討)
    io.emit(SOCKET_EVENTS.HEIGHT_CHANGE, heightArray);

  });
}

// --- displayOrderの最後尾を取得（ヘルパー） ---
async function getLastDisplayOrder() {
  try {

    const posts = await getPostsByDisplayOrder();
    const lastPost = posts[posts.length - 1];
    return lastPost ? lastPost.displayOrder + 1 : 1;

  } catch (error) { throw error; }
}

// --- positive/negativeリアクションの共通ハンドラー ---
function setupReactionHandlers(socket, io) {

  const reactionTypes = [SOCKET_EVENTS.POSITIVE, SOCKET_EVENTS.NEGATIVE];

  reactionTypes.forEach(reactionType => {

    socket.on(reactionType, async ({ postId, userSocketId, nickname }) => {
      try {

        // リアクション処理
        const reactionResult = await processPostReaction(postId, userSocketId, nickname, reactionType);

        // ブロードキャスト用データの作成
        const broadcastData =
          reactionType === SOCKET_EVENTS.POSITIVE
            ? { id: reactionResult.id, positive: reactionResult.reaction, userHasVotedPositive: reactionResult.userHasReacted }
            : { id: reactionResult.id, negative: reactionResult.reaction, userHasVotedNegative: reactionResult.userHasReacted };

        // ブロードキャスト
        io.emit(reactionType, broadcastData);

        // ログ記録
        saveLog({ userId: reactionResult.userId, action: reactionType, detail: { postId, userSocketId, nickname } });

      } catch (e) { console.error(e); }
    });
  });
}

// --- ドキュメントハンドラーのセットアップ ---
function setupDocHandlers(socket, io) {

  socket.on(SOCKET_EVENTS.DOC_ADD, async (payload) => {
    try {

      // prevDisplayOrder(行追加する1つ前の行)を取得
      let prevDisplayOrder = payload.prevDisplayOrder;

      // prevDisplayOrderが指定されていない場合は行追加を拒否
      if (prevDisplayOrder === undefined || !Number.isFinite(prevDisplayOrder)) {
        console.warn('❌ DOC_ADD拒否: prevDisplayOrderが未指定または不正', payload);
        socket.emit('doc-error', {
          error: 'DOC_ADD',
          message: '行の追加位置が指定されていません。再度お試しください。'
        });
        return;
      }

      // 現在の行の並び順を取得(TODO: DB関連の処理が多いので、docOperationへの移行を検討)
      const posts = await getPostsByDisplayOrder();

      // DB保存
      const newPost = await addDocRow({
        nickname: payload.nickname,
        msg: payload.msg || '',
        displayOrder: detectInsertPosition(prevDisplayOrder, posts),
      });

      // 新規行追加の結果を整形
      const data = {
        id: newPost.id,
        nickname: newPost.nickname,
        msg: newPost.msg,
        displayOrder: newPost.displayOrder
      };

      // 新規行追加を全クライアントにブロードキャスト
      io.emit(SOCKET_EVENTS.DOC_ADD, data);

      // ログ記録
      saveLog({ userId: newPost.userId, action: 'doc-add', detail: data });

    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_EDIT, async (payload) => {
    try {

      // 行IDが指定されていないときは、編集したユーザにエラーを通知
      if (!payload.id) {
        console.warn('❌ DOC_EDIT拒否: idが未指定または不正', payload);
        socket.emit('doc-error', {
          error: 'DOC_EDIT',
          message: '申し訳ございません。行編集でエラーが発生しました。'
        });
        return;
      }

      // DBに編集を保存
      const updatedPost = await updatePostData(payload);

      // updatedAtをpayloadに追加してemit
      io.emit(SOCKET_EVENTS.DOC_EDIT, { ...payload, updatedAt: updatedPost.updatedAt });

      // 編集完了時にロック解除
      unlockRowByPostId(lockedRows, io, payload.id);

      // ログ記録
      saveLog({ userId: null, action: 'doc-edit', detail: payload });

    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_REORDER, async (payload) => {
    try {

      // 受信データをデストラクション
      const {
        nickname,
        movedPostId,
        movedPostDisplayOrder,
        prev,
        next
      } = payload;

      // prevとnext から新しいdisplayOrderを計算
      const newDisplayOrder = calculateDisplayOrder(prev, next);

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

      // ログ記録
      saveLog({ userId: null, userNickname: nickname, action: 'doc-reorder', detail: payload });

    } catch (e) { console.error(e); }
  });

  socket.on(SOCKET_EVENTS.DOC_DELETE, async (payload) => {
    try {

      // 行削除処理
      const deleted = await deleteDocRow(payload.id);

      // 削除結果を全クライアントにブロードキャスト
      if (deleted) {
        
        io.emit(SOCKET_EVENTS.DOC_DELETE, { id: payload.id });

        // ログ記録
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
