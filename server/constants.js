// Socket.IO設定
const SOCKET_CONFIG = {
  cors: {
    origin: "http://127.0.0.1:5173"
  }
};

// イベント名定数
const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  LOGIN: 'login',
  CHAT_MESSAGE: 'chat-message',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  DOC_ADD: 'doc-add',
  DOC_EDIT: 'doc-edit',
  DOC_DELETE: 'doc-delete',
  DOC_REORDER: 'doc-reorder',
  DEMAND_LOCK: 'demand-lock',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  FETCH_HISTORY: 'fetch-history',
  FETCH_DOCS: 'fetch-docs',
  HEIGHT_CHANGE: 'heightChange'
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
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  PORT
};
