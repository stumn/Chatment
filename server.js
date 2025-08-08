const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

require('dotenv').config();
const { SOCKET_CONFIG, PORT } = require('./constants');

// Socket.IO設定
const io = new Server(server, SOCKET_CONFIG);

// ミドルウェア
app.use(express.static('my-react-app/dist'));
app.use(express.json());

// ルート設定
app.get('/plain', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// API ルート
const apiRoutes = require('./apiRoutes');
app.use('/api', apiRoutes);

// Socket.IOハンドラー
const { initializeSocketHandlers, rooms } = require('./socketHandlers');
const { initializeDefaultRooms, getActiveRooms } = require('./dbOperation');

initializeSocketHandlers(io);

// サーバー起動時にデフォルトルームを初期化（DB経由）
const initializeRoomsFromDatabase = async () => {
  try {
    console.log('🏠 [server] データベースからルーム初期化開始');

    // データベースにデフォルトルームを作成
    await initializeDefaultRooms();

    // データベースからアクティブなルームを取得してメモリに読み込み
    const dbRooms = await getActiveRooms();

    rooms.clear(); // 既存のメモリデータをクリア

    dbRooms.forEach(room => {
      rooms.set(room.id, {
        id: room.id,
        name: room.name,
        description: room.description,
        participants: new Set(), // 参加者は新規でスタート
        createdAt: room.createdAt,
        dbRoom: room
      });
    });

    console.log(`✅ [server] ${dbRooms.length}個のルームを初期化完了`);
  } catch (error) {
    console.error('❌ [server] ルーム初期化失敗:', error);
  }
};

// サーバー起動
const startServer = async () => {
  await initializeRoomsFromDatabase();
  
  server.listen(PORT, () => {
    console.log('listening on PORT:' + PORT);
  });
};
startServer();
