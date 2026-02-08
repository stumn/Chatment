const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

require('dotenv').config();
const { SOCKET_CONFIG, PORT } = require('./constants');

// Socket.IO設定
const io = new Server(server, SOCKET_CONFIG);

// ミドルウェア
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.json());

// ルート設定
app.get('/plain', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// API ルート
const apiRoutes = require('./apiRoutes');
app.use('/api', apiRoutes);

// SPAのルーティング対応 - 他のすべてのルートでReactアプリを返す
app.get('*', (req, res, next) => {
  // APIリクエストは除外
  if (req.path.startsWith('/api/') || req.path.startsWith('/plain')) {
    return next();
  }

  // 静的ファイル（CSS、JS、画像など）のリクエストかチェック
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  const indexPath = path.join(__dirname, '../client/dist/index.html');

  // ファイルが存在するかチェック
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('File not found:', indexPath);
    res.status(404).send('File not found');
  }
});

// Socket.IOハンドラー
const { initializeSocketHandlers } = require('./socketHandlers');

initializeSocketHandlers(io);

// サーバー起動
server.listen(PORT, () => {
  console.log('listening on PORT:' + PORT);
});
