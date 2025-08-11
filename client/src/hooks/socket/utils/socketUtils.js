// userIdが空文字列や不正な場合はundefinedにするユーティリティ
export const validUserId = (id) => {
  if (!id || typeof id !== 'string' || id.trim() === '' || !id.match(/^[a-fA-F0-9]{24}$/)) return undefined;
  return id;
};

// 任意の操作ログをサーバに送信するユーティリティ
export const createEmitLog = (socket) => (log) => {
  socket.emit('log', log);
};
