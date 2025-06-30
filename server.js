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

const { saveUser, SaveChatMessage, getPastLogs } = require('./dbOperation');
// const { handleErrors, checkVoteStatus, calculate_VoteSum, checkEventStatus } = require('./utils');

const heightMemory = []; // 高さを記憶するためのオブジェクト

function addHeightMemory(id, height) {
  const index = heightMemory.findIndex(item => item.id === id);
  index !== -1
    ? heightMemory[index].height = height
    : heightMemory.push({ id, height });
  return heightMemory.map(item => item.height); // 高さを全て返す
}

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

      socket.emit('connect OK', newUser); // emit to client

    } catch (e) { console.error(e); }

    socket.on('fetch-history', async () => {
      try {
        const messages = await getPastLogs(nickname); // fetch posts from database
        socket.emit('history', messages); // emit to client
      } catch (e) { console.error(e); }
    });

    socket.on('heightChange', (height) => {
      const heightArray = addHeightMemory(socket.id, height); // 高さを記憶する関数を呼び出す
      io.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    });

    socket.on('chat-message', async ({ nickname, message }) => {
      try {
        console.log('chat-message:', nickname, message);
        const p = await SaveChatMessage(nickname, message); // save message to database
        io.emit('chat-message', p);
      } catch (e) { console.error(e); }
    });

    socket.on('fav', async id => {
      const update = { $inc: { count: 1 } };
      const options = { new: true };
      try {
        const p = await Post.findByIdAndUpdate(id, update, options);
        io.emit('fav', p);
      } catch (e) { console.error(e); }
    });

  })

  socket.on('disconnect', () => {
    console.log('user disconnected');

    // hightArray から 削除する
    // const heightArray = removeHeightMemory(socket.id);

    // socket.broadcast.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    // console.log('disconnect -> remove heightMemory', heightMemory);
  });
});

server.listen(PORT, () => {
  console.log('listening on PORT:' + PORT);
});
