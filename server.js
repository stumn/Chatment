const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173"
  }
});

require('dotenv').config();
const PORT = process.env.PORT || 3000;
const { mongoose, User, Post } = require('./db');

app.use(express.static('my-react-app/dist')); // 追加
app.get('/plain', (req, res) => { // 変更
  res.sendFile(__dirname + '/index.html');
});

// パフォーマンス測定エンドポイント
app.get('/api/room-stats', async (req, res) => {
  try {
    console.time('room-stats-api');
    
    const stats = await getAllRoomsWithStats();
    const messageCounts = await getRoomMessageCounts();
    
    console.timeEnd('room-stats-api');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      roomStats: stats,
      messageCounts: messageCounts
    });
  } catch (error) {
    console.error('Room stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// インデックス使用状況確認エンドポイント（開発用）
app.get('/api/db-performance/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const explanation = await explainRoomQuery(roomId);
    
    res.json({
      success: true,
      roomId: roomId,
      performance: {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        totalDocsReturned: explanation.executionStats.totalDocsReturned,
        indexUsed: explanation.executionStats.executionStages.indexName || 'No index used'
      }
    });
  } catch (error) {
    console.error('DB performance API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const {
  saveUser, SaveChatMessage, getPastLogs,
  addDocRow, getPostsByDisplayOrder, updateDisplayOrder,
  saveLog, deleteDocRow, // 追加
  // ルーム機能用の最適化された関数
  getRoomHistory, getAllRoomsWithStats, getRoomMessageCounts, explainRoomQuery
} = require('./dbOperation');

const heightMemory = []; // 高さを記憶するためのオブジェクト

// ルーム管理のためのデータ構造
const rooms = new Map(); // roomId -> { id, name, description, participants: Set(userId), createdAt }
const userRooms = new Map(); // userId -> roomId (ユーザーが現在参加しているルーム)

// デフォルトルームを初期化
const initializeDefaultRooms = () => {
  const defaultRooms = [
    {
      id: 'room-1',
      name: '発表関連',
      description: '発表に関連した議論をしよう',
      participants: new Set(),
      createdAt: new Date()
    },
    {
      id: 'room-2', 
      name: 'general',
      description: '全員へのアナウンス',
      participants: new Set(),
      createdAt: new Date()
    },
    {
      id: 'room-3',
      name: 'random',
      description: 'つぶやき',
      participants: new Set(),
      createdAt: new Date()
    },
    {
      id: 'room-4',
      name: '雑談',
      description: 'とにかく雑談しよう',
      participants: new Set(),
      createdAt: new Date()
    }
  ];

  defaultRooms.forEach(room => {
    rooms.set(room.id, room);
  });

  console.log('Default rooms initialized:', Array.from(rooms.keys()));
};

// サーバー起動時にデフォルトルームを初期化
initializeDefaultRooms();


function addHeightMemory(id, height) {
  const index = heightMemory.findIndex(item => item.id === id);
  index !== -1
    ? heightMemory[index].height = height
    : heightMemory.push({ id, height });
  return heightMemory.map(item => item.height); // 高さを全て返す
}

// 現在ロック中の行IDとユーザ情報のマップ
const lockedRows = new Map(); // 行IDとユーザ情報(nickname, userId)のマップ
console.log(lockedRows);

// const FADE_OUT_TIME = 10000; // 10秒後に削除
// function removeHeightMemory(id) {

//   setTimeout(() => {  
//     const index = heightMemory.findIndex(item => item.id === id);
//     if (index !== -1) heightMemory.splice(index, 1);

//     return heightMemory.map(item => item.height); // 高さを全て返す

//   }, FADE_OUT_TIME); // 10秒後に削除  
// }

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('login', async (userInfo) => {
    const { nickname, status, ageGroup } = userInfo; // userInfoから必要な情報を取得
    console.log('login:', nickname, status, ageGroup, socket.id);

    try {

      if (!nickname || !status || !ageGroup) {
        console.error('Invalid user info:', userInfo);
        return;
      }

      const newUser = await saveUser(nickname, status, ageGroup, socket.id); // save user to database
      console.log('newUser:', newUser);

      // socketにユーザー情報を保存（ルーム管理で使用）
      socket.userId = newUser._id.toString();
      socket.nickname = nickname;

      socket.emit('connect OK', newUser); // emit to client

    } catch (e) { console.error(e); }

    socket.on('fetch-history', async () => {
      try {
        const messages = await getPastLogs(nickname); // fetch posts from database
        socket.emit('history', messages); // emit to client
      } catch (e) { console.error(e); }
    });

    socket.on('fetch-docs', async () => {
      try {
        const docs = await getPostsByDisplayOrder(); // fetch posts by display order
        socket.emit('docs', docs); // emit to client
      } catch (e) { console.error(e); }
    });

    socket.on('heightChange', (height) => {
      const heightArray = addHeightMemory(socket.id, height); // 高さを記憶する関数を呼び出す
      io.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    });

    socket.on('chat-message', async ({ nickname, message, userId, roomId }) => {
      try {
        console.log('💬 [server] chat-message:', { nickname, message, userId, socketId: socket.id, roomId });

        // displayOrderを計算
        const displayOrder = await getNextDisplayOrder();
        console.log('Calculated displayOrder:', displayOrder);

        // チャットメッセージをDBに保存（ルーム情報も含める）
        const messageData = {
          nickname,
          message,
          userId,
          displayOrder,
          ...(roomId && { roomId }) // roomIdがある場合のみ追加
        };

        const p = await SaveChatMessage(messageData.nickname, messageData.message, messageData.userId, messageData.displayOrder, messageData.roomId);

        // ルームメッセージの場合は、Socket.IOルーム機能で効率的に配信
        if (roomId && rooms.has(roomId)) {
          console.log(`🏠 [server] Socket.IO ルーム room-${roomId} にメッセージ送信`);
          
          // Socket.IOのルーム機能を使用して、該当ルームの全参加者に即座に送信
          const responseData = { ...p, roomId };
          io.to(`room-${roomId}`).emit('chat-message', responseData);
          
          console.log(`⚡ [server] Socket.IO ルーム配信完了: room-${roomId}`);
        } else {
          // 通常のチャットメッセージは全クライアントに送信
          console.log('💬 [server] 全クライアントにメッセージ送信');
          io.emit('chat-message', p);
        }

        // --- ログ記録 ---
        saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder, roomId } });
      } catch (e) { console.error(e); }
    });

    function getNextDisplayOrder() {
      return new Promise(async (resolve, reject) => {
        try {
          const posts = await getPostsByDisplayOrder();
          const lastPost = posts[posts.length - 1];
          const nextOrder = lastPost ? lastPost.displayOrder + 1 : 1;
          resolve(nextOrder);
        } catch (error) {
          reject(error);
        }
      });
    }

    // --- fav関連のsocketイベント・ロジックは削除 ---

    // --- positiveトグルイベント ---
    socket.on('positive', async ({ postId, userSocketId, nickname }) => {
      try {
        const post = await Post.findById(postId);
        if (!post) return;
        const idx = post.positive.findIndex(p => p.userSocketId === userSocketId);
        if (idx !== -1) {
          post.positive.splice(idx, 1);
        } else {
          post.positive.push({ userSocketId, nickname });
        }
        await post.save();
        io.emit('positive', {
          id: post.id,
          positive: post.positive.length,
          isPositive: post.positive.some(p => p.userSocketId === userSocketId),
        });
        // --- ログ記録 ---
        saveLog({ userId: post.userId, action: 'positive', detail: { postId, userSocketId, nickname } });
      } catch (e) { console.error(e); }
    });

    // --- negativeトグルイベント ---
    socket.on('negative', async ({ postId, userSocketId, nickname }) => {
      try {
        const post = await Post.findById(postId);
        if (!post) return;
        const idx = post.negative.findIndex(n => n.userSocketId === userSocketId);
        if (idx !== -1) {
          post.negative.splice(idx, 1);
        } else {
          post.negative.push({ userSocketId, nickname });
        }
        await post.save();
        io.emit('negative', {
          id: post.id,
          negative: post.negative.length,
          isNegative: post.negative.some(n => n.userSocketId === userSocketId),
        });
        // --- ログ記録 ---
        saveLog({ userId: post.userId, action: 'negative', detail: { postId, userSocketId, nickname } });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 行追加 ---
    socket.on('doc-add', async (payload) => {
      try {
        console.log('🐟doc-add(これは1つ上のメッセージ情報):', payload);

        let displayOrder = payload.displayOrder;
        const posts = await getPostsByDisplayOrder(); // displayOrderでソート済みのpostsを取得

        // payload.displayOrderが指定されている場合はそれを優先
        if (displayOrder === undefined || !Number.isFinite(displayOrder)) {
          console.log('displayOrderが未指定または不正な値:', displayOrder);

          // displayOrderが未指定の場合、挿入位置に基づいて計算
          if (posts.length === 0) {
            displayOrder = 1; // 投稿が一つもない場合は1
            console.log('postsが空なのでdisplayOrderを1に設定');
          }
          else if (payload.insertAfterId) { // 特定のIDの後に挿入する場合
            const targetPostIndex = posts.findIndex(p => p.id === payload.insertAfterId);
            console.log('insertAfterIdが指定されている:', payload.insertAfterId, 'targetPostIndex:', targetPostIndex);

            if (targetPostIndex !== -1) {
              const prev = posts[targetPostIndex];
              const next = posts[targetPostIndex + 1];
              console.log('prev:', prev, 'next:', next);

              if (next) {
                displayOrder = (prev.displayOrder + next.displayOrder) / 2;
                console.log('次の投稿があるので、displayOrderを平均値に設定:', displayOrder);
              }
              else {
                displayOrder = prev.displayOrder + 1;
                console.log('次の投稿がないので、displayOrderを前の投稿の次に設定:', displayOrder);
              }
            } else {
              // 対象IDが見つからない場合は末尾に追加
              displayOrder = posts[posts.length - 1].displayOrder + 1;
              console.log('insertAfterIdが見つからないので、末尾に追加:', displayOrder);
            }
          } else { // insertAfterIdが指定されていない場合は末尾に追加
            displayOrder = posts[posts.length - 1].displayOrder + 1;
            console.log('insertAfterIdが指定されていないので、末尾に追加:', displayOrder);
          }
        }

        // 最終チェック: NaNや不正値なら最大+1または1
        if (!Number.isFinite(displayOrder)) {
          displayOrder = posts.length > 0 ? posts[posts.length - 1].displayOrder + 1 : 1;
          console.log('displayOrderが不正な値だったので、最大+1または1に設定:', displayOrder);
        }

        // DB保存
        const newPost = await addDocRow({
          nickname: payload.nickname,
          msg: payload.msg || '',
          displayOrder: calculateDisplayOrder(displayOrder, posts),
        });

        console.log('新規行追加:', newPost);

        // 全クライアントに新規行追加をブロードキャスト
        const data = {
          id: newPost.id,
          nickname: newPost.nickname,
          msg: newPost.msg,
          displayOrder: newPost.displayOrder
        };

        console.log('doc-add emit data:', data);
        io.emit('doc-add', data);
        // --- ログ記録 ---
        saveLog({ userId: newPost.userId, action: 'doc-add', detail: data });
      } catch (e) { console.error(e); }
    });

    // 関数: displayOrderの計算
    function calculateDisplayOrder(displayOrder, posts) {
      // 前後の投稿の浮動小数点数を求める

      // displayOrderが今回挿入したい新規行の1つ上
      const prev = displayOrder;

      // displayOrderが今回挿入したい新規行の1つ下
      const next = posts.find(p => p.displayOrder > displayOrder);

      console.log('calculateDisplayOrder:', { displayOrder, prev, next });

      if (prev && next) {
        // 前後の投稿が存在する場合、平均値を取る
        return (prev + next.displayOrder) / 2;
      }

      // 前の投稿が存在する場合、次の投稿の前に挿入
      if (prev) {
        return prev + 1;
      }

      // 次の投稿が存在する場合、次の投稿の前に挿入
      if (next) {
        return next.displayOrder - 1;
      }

      // どちらも存在しない場合は1を返す
      return 1;
    }

    // --- Doc 系；ロック要求の受け取り---
    socket.on('demand-lock', async (data) => {
      // data:{ `dc-${index}-${message?.displayOrder}-${message?.id}`, nickname }
      try {
        console.log('demand-lock received:', data);

        if (data.rowElementId && data.nickname) {
          
          // lockedRows に含まれているかどうかをチェック(lockdRows: Id, nickname, userId)
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

            // 'demand-lock'を送ってきたクライアントのみに送信
            socket.emit('Lock-permitted', { id: data.rowElementId, nickname: data.nickname });

            // 他のクライアントにロックされた行をブロードキャスト
            socket.broadcast.emit('row-locked', { id: data.rowElementId, nickname: data.nickname });
          }
        }
      } catch (e) { console.error(e); }

    });

    // --- Doc系: 行編集 ---
    socket.on('doc-edit', async (payload) => {
      // payload: { index, newMsg, id, nickname }
      try {
        console.log('doc-edit:', payload);

        if (payload.id) {
          const updateObj = { msg: payload.newMsg };
          if (payload.nickname) updateObj.nickname = payload.nickname;
          updateObj.updatedAt = new Date();

          const updatedPost = await Post.findByIdAndUpdate(payload.id, updateObj, { new: true });

          // updatedAtをpayloadに追加してemit
          io.emit('doc-edit', { ...payload, updatedAt: updatedPost.updatedAt });

          // 編集完了時にロック解除
          unlockRowByPostId(payload.id);
        } else {
          io.emit('doc-edit', payload);
        }
        // --- ログ記録 ---
        saveLog({ userId: null, action: 'doc-edit', detail: payload });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 並び替え ---
    socket.on('doc-reorder', async (payload) => {

      try {
        console.log('doc-reorder:', payload);
        const {
          nickname,
          movedPostId,
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        } = payload;

        console.log('doc-reorder payload:', {
          nickname,
          movedPostId,
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        });

        // beforeとafter から新しいdisplayOrderを計算
        const newDisplayOrder = calculateNewDisplayOrder(
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        );

        // DB更新
        await updateDisplayOrder(movedPostId, newDisplayOrder);

        // 全クライアントに並び替えをブロードキャスト
        const posts = await getPostsByDisplayOrder(movedPostDisplayOrder); // displayOrderでソート済みのpostsを取得
        
        // 並び替え情報に実行者の情報を含めて送信
        io.emit('doc-reorder', {
          posts: posts,
          reorderInfo: {
            movedPostId: movedPostId,
            executorNickname: nickname
          }
        });

        // 並び替え完了時にロック解除
        unlockRowByPostId(movedPostId);

        // --- ログ記録 ---
        saveLog({ userId: null, userNickname: nickname, action: 'doc-reorder', detail: payload });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 行削除 ---
    socket.on('doc-delete', async (payload) => {
      // payload: { id }
      try {
        console.log('doc-delete:', payload);
        const deleted = await deleteDocRow(payload.id);
        if (deleted) {
          io.emit('doc-delete', { id: payload.id });
          saveLog({ userId: null, action: 'doc-delete', detail: payload });
        }
      } catch (e) { console.error(e); }
    });
  });

  function calculateNewDisplayOrder(movedDisplayOrder, beforePostDisplayOrder, afterPostDisplayOrder) {
    // displayOrderの計算ロジックをここに実装
    console.log('calculateDisplayOrder:', {
      movedDisplayOrder,
      beforePostDisplayOrder,
      afterPostDisplayOrder
    });

    if (beforePostDisplayOrder && afterPostDisplayOrder) {
      console.log('前後の投稿が存在する場合、平均値を取る');
      // 前後の投稿が存在する場合、平均値を取る
      return (beforePostDisplayOrder + afterPostDisplayOrder) / 2;
    }

    // 前の投稿が存在する場合、次の投稿の前に挿入
    if (beforePostDisplayOrder) {
      return beforePostDisplayOrder + 1;
    }

    // 次の投稿が存在する場合、次の投稿の前に挿入
    if (afterPostDisplayOrder) {
      return afterPostDisplayOrder - 1;
    }

    // どちらも存在しない場合は1を返す
    return 1;
  }

  // --- クライアントからの任意操作ログを受信して保存 ---
  socket.on('log', (log) => {
    // log: { userId, action, detail }
    saveLog(log);
  });

  // --- ルーム関連のイベントハンドラー ---
  
  // ルーム参加
  socket.on('join-room', ({ roomId, userId, nickname, userInfo }) => {
    try {
      console.log(`🚀 [server] ルーム参加要求: ${nickname} -> ${roomId}`);
      
      // ルームが存在するかチェック
      if (!rooms.has(roomId)) {
        socket.emit('room-error', { error: 'Room not found', roomId, message: 'ルームが見つかりません' });
        return;
      }

      // 現在のルームから退出（もしあれば）
      const currentRoomId = userRooms.get(userId);
      if (currentRoomId && rooms.has(currentRoomId)) {
        const currentRoom = rooms.get(currentRoomId);
        currentRoom.participants.delete(userId);
        
        // 現在のルームの他の参加者に退出を通知
        currentRoom.participants.forEach(participantUserId => {
          const participantSocket = [...io.sockets.sockets.values()]
            .find(s => s.userId === participantUserId);
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
      socket.userId = userId; // socket に userId を保存
      socket.roomId = roomId; // socket に roomId を保存
      socket.nickname = nickname; // socket に nickname を保存

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
          const participantSocket = [...io.sockets.sockets.values()]
            .find(s => s.userId === participantUserId);
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
      
      // ログ記録
      saveLog({ userId, action: 'join-room', detail: { roomId, nickname, participantCount: room.participants.size } });

    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム参加中にエラーが発生しました' });
    }
  });

  // ルーム退出
  socket.on('leave-room', ({ roomId, userId, nickname }) => {
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

      // 退出成功をクライアントに通知
      socket.emit('room-left', {
        roomId,
        participantCount: room.participants.size
      });

      // 他の参加者に退出を通知
      room.participants.forEach(participantUserId => {
        const participantSocket = [...io.sockets.sockets.values()]
          .find(s => s.userId === participantUserId);
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
      
      // ログ記録
      saveLog({ userId, action: 'leave-room', detail: { roomId, nickname, participantCount: room.participants.size } });

    } catch (error) {
      console.error('Error in leave-room:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム退出中にエラーが発生しました' });
    }
  });

  // ルーム一覧取得
  socket.on('get-room-list', () => {
    try {
      console.log('📋 [server] ルーム一覧要求');
      
      const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        participantCount: room.participants.size,
        createdAt: room.createdAt
      }));

      socket.emit('room-list', { rooms: roomList });
      
      console.log(`✅ [server] ルーム一覧送信 (${roomList.length}件)`);

    } catch (error) {
      console.error('Error in get-room-list:', error);
      socket.emit('room-error', { error: error.message, message: 'ルーム一覧取得中にエラーが発生しました' });
    }
  });

  // ルーム詳細情報取得
  socket.on('get-room-info', ({ roomId }) => {
    try {
      console.log(`📋 [server] ルーム詳細要求: ${roomId}`);
      
      if (!rooms.has(roomId)) {
        socket.emit('room-error', { error: 'Room not found', roomId, message: 'ルームが見つかりません' });
        return;
      }

      const room = rooms.get(roomId);
      const participantList = Array.from(room.participants);

      socket.emit('room-info', {
        roomId,
        roomInfo: {
          name: room.name,
          description: room.description,
          participantCount: room.participants.size,
          participants: participantList,
          createdAt: room.createdAt
        }
      });

      console.log(`✅ [server] ルーム詳細送信: ${roomId}`);

    } catch (error) {
      console.error('Error in get-room-info:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム情報取得中にエラーが発生しました' });
    }
  });

  // ルーム履歴取得（最適化版）
  socket.on('fetch-room-history', async ({ roomId }) => {
    try {
      console.log(`📚 [server] ${roomId} の履歴要求`);
      
      if (!roomId) {
        socket.emit('room-error', { error: 'Room ID required', message: 'ルームIDが指定されていません' });
        return;
      }

      // 最適化されたデータベース関数を使用
      const messages = await getRoomHistory(roomId, 50);
      
      // 履歴をクライアントに送信
      socket.emit('room-history', { 
        roomId, 
        messages: messages
      });
      
      console.log(`✅ [server] ${roomId} 履歴送信完了 (${messages.length}件)`);
      
      // 開発環境でのパフォーマンス測定
      if (process.env.NODE_ENV === 'development') {
        await explainRoomQuery(roomId);
      }
      
    } catch (error) {
      console.error('Error fetching room history:', error);
      socket.emit('room-error', { error: error.message, roomId, message: 'ルーム履歴取得中にエラーが発生しました' });
    }
  });

  // ロック解除のユーティリティ関数群
  
  // PostIDからロック中の行を特定してロック解除
  function unlockRowByPostId(postId) {
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

  // 明示的なロック解除イベント
  socket.on('unlock-row', (data) => {
    // data: { rowElementId, postId }
    try {
      console.log('unlock-row received:', data);
      
      if (data.rowElementId && lockedRows.has(data.rowElementId)) {
        const lockInfo = lockedRows.get(data.rowElementId);
        console.log('Unlocking row:', data.rowElementId, 'previously locked by:', lockInfo.nickname);
        
        lockedRows.delete(data.rowElementId);
        
        // 全クライアントにロック解除をブロードキャスト
        io.emit('row-unlocked', { id: data.rowElementId, postId: data.postId });
      }
    } catch (e) { console.error(e); }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);

    // ルームからの自動退出処理
    if (socket.userId && socket.roomId) {
      const roomId = socket.roomId;
      const userId = socket.userId;
      
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.participants.delete(userId);
        userRooms.delete(userId);

        // Socket.IOルームからも退出
        if (socket.currentSocketRoom) {
          socket.leave(socket.currentSocketRoom);
          console.log(`🚪 [server] 切断時 Socket.IO ルーム退出: ${socket.currentSocketRoom}`);
        }

        // 他の参加者に退出を通知
        room.participants.forEach(participantUserId => {
          const participantSocket = [...io.sockets.sockets.values()]
            .find(s => s.userId === participantUserId);
          if (participantSocket) {
            participantSocket.emit('user-left', {
              roomId,
              userId,
              nickname: socket.nickname || 'Unknown',
              participantCount: room.participants.size
            });
          }
        });

        console.log(`👋 [server] 切断により ${userId} が ${roomId} から自動退出 (参加者数: ${room.participants.size})`);
      }
    }

    // ユーザー切断時に該当ユーザーがロックしていた行を全て解除
    for (const [rowElementId, lockInfo] of lockedRows.entries()) {
      if (lockInfo.socketId === socket.id) {
        console.log('Unlocking row due to disconnect:', rowElementId);
        lockedRows.delete(rowElementId);
        
        // 全クライアントにロック解除をブロードキャスト
        io.emit('row-unlocked', { id: rowElementId, reason: 'user_disconnected' });
      }
    }

    // hightArray から 削除する
    // const heightArray = removeHeightMemory(socket.id);

    // socket.broadcast.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    // console.log('disconnect -> remove heightMemory', heightMemory);
  });
});

server.listen(PORT, () => {
  console.log('listening on PORT:' + PORT);
});

