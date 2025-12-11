// Socket.IO設定
const SOCKET_CONFIG = {
  cors: {
    origin: "http://127.0.0.1:5173"
  }
};

// ポート設定
const PORT = process.env.PORT || 3000;

module.exports = {
  SOCKET_CONFIG,
  PORT
};
