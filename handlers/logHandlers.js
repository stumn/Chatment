const { saveLog } = require('../dbOperation');

function setupLogHandlers(socket, io) {
  socket.on('log', (log) => {
    saveLog(log);
  });
}

module.exports = {
  setupLogHandlers
};
