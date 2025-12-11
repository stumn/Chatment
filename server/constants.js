// Socket.IO設定
const SOCKET_CONFIG = {
  cors: {
    origin: "http://127.0.0.1:5173"
  }
};

// エラーメッセージ
const ERROR_MESSAGES = {
  INVALID_USER_INFO: 'Invalid user info',
  ROW_ALREADY_LOCKED: 'Row is already locked',
  ROOM_NOT_FOUND: 'Room not found',
  MISSING_REQUIRED_FIELDS: 'Missing required fields'
};

// ポート設定
const PORT = process.env.PORT || 3000;

module.exports = {
  SOCKET_CONFIG,
  ERROR_MESSAGES,
  PORT
};
