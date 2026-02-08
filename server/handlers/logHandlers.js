const { saveLog } = require('../dbOperation');

function setupLogHandlers(socket, io) {
  socket.on('log', (log) => {
    // クライアント提供データを信頼せず、socket情報を使用
    const trustedLog = {
      ...log,
      userId: socket.userId,
      userNickname: socket.nickname,
      spaceId: socket.spaceId
    };
    saveLog(trustedLog);
  });
}

module.exports = {
  setupLogHandlers
};
