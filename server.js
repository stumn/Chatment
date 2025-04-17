require('dotenv').config();

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "https://chatment.onrender.com",
    methods: ["GET", "POST"],
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error('Error: MONGODB_URL is not defined');
  process.exit(1);
}

const mongoose = require('mongoose');
mongoose.connect(MONGODB_URL);

// Database options
const options = {
  timestamps: true, // add timestamp
  toJSON: { // change the way how data is converted to JSON
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => { delete ret._id; return ret; }
  }
};

// Define the shape of data (= schema) to be saved, and construct a model from the schema.
const postSchema = new mongoose.Schema({ name: String, msg: String, count: Number }, options);
const Post = mongoose.model("Post", postSchema);

// React のビルドファイルを静的配信
app.use(express.static(path.join(__dirname, 'my-react-app', 'dist')));

app.get('/plain', (req, res) => { // 変更
  res.sendFile(__dirname + '/index.html');
});

// その他のルートは React の index.html にフォールバック
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-react-app', 'dist', 'index.html'));
});

const heightMemory = []; // 高さを記憶するためのオブジェクト
function addHeightMemory(id, height) {
  const index = heightMemory.findIndex(item => item.id === id);
  index !== -1
    ? heightMemory[index].height = height
    : heightMemory.push({ id, height });
  return heightMemory.map(item => item.height); // 高さを全て返す
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('heightChange', height => {
    console.log('heightChange', height);
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
  });
});

server.listen(PORT, () => {
  console.log('listening on PORT:' + PORT);
});