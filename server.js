const express = require('express');
const app = express();
app.use(express.static('client/dist'));
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

// const { saveUser, getUserInfo, getPastLogs, organizeCreatedAt, SaveChatMessage, SavePersonalMemo, SaveSurveyMessage, SaveRevealMemo, SaveKasaneteMemo, findPost, findMemo, fetchPosts, saveStackRelation, SaveParentPost } = require('./dbOperations');
// const { handleErrors, checkVoteStatus, calculate_VoteSum, checkEventStatus } = require('./utils');

const heightMemory = []; // 高さを記憶するためのオブジェクト

function addHeightMemory(id, height) {
  const index = heightMemory.findIndex(item => item.id === id);
  index !== -1
    ? heightMemory[index].height = height
    : heightMemory.push({ id, height });
  return heightMemory.map(item => item.height); // 高さを全て返す
}

const FADE_OUT_TIME = 10000; // 10秒後に削除
function removeHeightMemory(id) {

  setTimeout(() => {  
    const index = heightMemory.findIndex(item => item.id === id);
    if (index !== -1) heightMemory.splice(index, 1);

    return heightMemory.map(item => item.height); // 高さを全て返す

  }, FADE_OUT_TIME); // 10秒後に削除  
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('heightChange', height => {
    // console.log('heightChange', height);
    const heightArray = addHeightMemory(socket.id, height); // 高さを記憶する関数を呼び出す
    io.emit('heightChange', heightArray); // 他のクライアントに高さを通知
  });

  socket.on('login', async (name) => {
    try {
      const posts = await Post.find({}).limit(10); // fetch 10 latest posts from database
      posts.forEach(p => socket.emit('chat message', p));
    } catch (e) { console.error(e); }

    io.emit('login', name);

    socket.on('chat message', async (msg) => {
      try {
        const p = await Post.create({ name, msg, count: 0 }); // save data to database
        io.emit('chat message', p);
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
    const heightArray = removeHeightMemory(socket.id);

    socket.broadcast.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    console.log('disconnect -> remove heightMemory', heightMemory);
  });
});

server.listen(PORT, () => {
  console.log('listening on PORT:' + PORT);
});
