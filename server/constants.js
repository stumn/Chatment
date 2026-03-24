const DEFAULT_SOCKET_ORIGINS = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
];

const socketCorsOrigins = (process.env.SOCKET_CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = socketCorsOrigins.length > 0
  ? socketCorsOrigins
  : DEFAULT_SOCKET_ORIGINS;

// Socket.IO設定
const SOCKET_CONFIG = {
  cors: {
    // origin: 接続してきたブラウザのオリジン文字列
    // callback: CORS許可の結果を返すコールバック関数

    origin: (origin, callback) => {
      // Allow non-browser clients and same-origin requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL || 25000),
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT || 20000),
  connectTimeout: Number(process.env.SOCKET_CONNECT_TIMEOUT || 30000)
};

// ポート設定
const PORT = process.env.PORT || 3000;

module.exports = {
  SOCKET_CONFIG,
  PORT
};
