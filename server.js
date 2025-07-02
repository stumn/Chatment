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

const {
  saveUser, SaveChatMessage, getPastLogs,
  addDocRow, getPostsByDisplayOrder, updateDisplayOrder
} = require('./dbOperation');

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

    socket.on('fetch-docs', async () => {
      try {
        const docs = await getPostsByDisplayOrder(); // fetch posts by display order
        socket.emit('docs', docs); // emit to client
      } catch (e) { console.error(e); }
    });

    socket.on('heightChange', (height) => {
      const heightArray = addHeightMemory(socket.id, height); // 高さを記憶する関数を呼び出す
      io.emit('heightChange', heightArray); // 他のクライアントに高さを通知
    });

    socket.on('chat-message', async ({ nickname, message, userId }) => {
      try {
        console.log('chat-message:', nickname, message, userId);
        const p = await SaveChatMessage(nickname, message, userId); // userIdも保存
        io.emit('chat-message', p);
      } catch (e) { console.error(e); }
    });

    // --- fav関連のsocketイベント・ロジックは削除 ---

    // --- positiveトグルイベント ---
    socket.on('positive', async ({ postId, userSocketId, nickname }) => {
      try {
        const post = await Post.findById(postId);
        if (!post) return;
        const idx = post.positive.findIndex(p => p.userSocketId === userSocketId);
        if (idx !== -1) {
          post.positive.splice(idx, 1);
        } else {
          post.positive.push({ userSocketId, nickname });
        }
        await post.save();
        io.emit('positive', {
          id: post.id,
          positive: post.positive.length,
          isPositive: post.positive.some(p => p.userSocketId === userSocketId),
        });
      } catch (e) { console.error(e); }
    });
    // --- negativeトグルイベント ---
    socket.on('negative', async ({ postId, userSocketId, nickname }) => {
      try {
        const post = await Post.findById(postId);
        if (!post) return;
        const idx = post.negative.findIndex(n => n.userSocketId === userSocketId);
        if (idx !== -1) {
          post.negative.splice(idx, 1);
        } else {
          post.negative.push({ userSocketId, nickname });
        }
        await post.save();
        io.emit('negative', {
          id: post.id,
          negative: post.negative.length,
          isNegative: post.negative.some(n => n.userSocketId === userSocketId),
        });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 行追加 ---
    socket.on('doc-add', async (payload) => {
      try {
        console.log('🐟doc-add:', payload);
        let displayOrder = payload.displayOrder;
        const posts = await getPostsByDisplayOrder(); // displayOrderでソート済みのpostsを取得

        // payload.displayOrderが指定されている場合はそれを優先
        if (displayOrder === undefined || !Number.isFinite(displayOrder)) {
          // displayOrderが未指定の場合、挿入位置に基づいて計算
          if (posts.length === 0) {
            displayOrder = 1; // 投稿が一つもない場合は1
          } else if (payload.insertAfterId) { // 特定のIDの後に挿入する場合
            const targetPostIndex = posts.findIndex(p => p.id === payload.insertAfterId);
            if (targetPostIndex !== -1) {
              const prev = posts[targetPostIndex];
              const next = posts[targetPostIndex + 1];
              if (next) {
                displayOrder = (prev.displayOrder + next.displayOrder) / 2;
              } else {
                displayOrder = prev.displayOrder + 1;
              }
            } else {
              // 対象IDが見つからない場合は末尾に追加
              displayOrder = posts[posts.length - 1].displayOrder + 1;
            }
          } else { // insertAfterIdが指定されていない場合は末尾に追加
            displayOrder = posts[posts.length - 1].displayOrder + 1;
          }
        }

        // 最終チェック: NaNや不正値なら最大+1または1
        if (!Number.isFinite(displayOrder)) {
          displayOrder = posts.length > 0 ? posts[posts.length - 1].displayOrder + 1 : 1;
        }

        // DB保存
        const newPost = await addDocRow({
          nickname: payload.nickname,
          msg: payload.msg || '',
          displayOrder
        });
        
        // 全クライアントに新規行追加をブロードキャスト
        io.emit('doc-add', {
          id: newPost.id,
          nickname: newPost.nickname,
          msg: newPost.msg,
          displayOrder: newPost.displayOrder,
        });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 行編集 ---
    socket.on('doc-edit', async (payload) => {
      // payload: { index, newMsg, id }
      try {
        console.log('doc-edit:', payload);
        // DB更新: Post.findByIdAndUpdate など（必要に応じて）
        // ここではidがあれば更新、なければindexで特定（簡易実装）
        if (payload.id) {
          await Post.findByIdAndUpdate(payload.id, { msg: payload.newMsg });
        }
        // 全クライアントに編集内容をブロードキャスト
        io.emit('doc-edit', payload);
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 並び替え ---
    // socket.on('doc-reorder', async (payload) => {
    //   // payload: { fromIndex, toIndex }
    //   try {
    //     console.log('doc-reorder:', payload);
    //     // DB側でorderを更新する場合はここで実装
    //     // 今回はクライアント側でorder再採番する前提で、全クライアントに通知のみ
    //     io.emit('doc-reorder', payload);
    //   } catch (e) { console.error(e); }
    // });
    socket.on('doc-reorder', async (payload) => {
      // payload: { id: movedPostId, beforeId: string, afterId: string }
      try {
        console.log('doc-reorder:', payload);
        const { id: movedPostId, beforeId, afterId } = payload;

        const posts = await getPostsByDisplayOrder(); // displayOrderでソート済みのpostsを取得

        let newDisplayOrder;

        // beforeIdとafterIdに基づいて新しいdisplayOrderを計算
        const beforePost = posts.find(p => p.id === beforeId);
        const afterPost = posts.find(p => p.id === afterId);

        if (beforePost && afterPost) {
          newDisplayOrder = (beforePost.displayOrder + afterPost.displayOrder) / 2;
        } else if (beforePost) {
          newDisplayOrder = beforePost.displayOrder + 1;
        } else if (afterPost) {
          newDisplayOrder = afterPost.displayOrder / 2;
        } else {
          // beforeIdもafterIdも存在しない場合（リストの最初や最後の移動、またはリストが空の場合）
          // このケースは通常発生しないはずだが、堅牢性のため
          newDisplayOrder = posts.length > 0 ? posts[posts.length - 1].displayOrder + 1 : 1;
        }

        // DB更新
        await updateDisplayOrder(movedPostId, newDisplayOrder);

        // 全クライアントに更新されたdisplayOrderをブロードキャスト
        io.emit('doc-reorder', {
          id: movedPostId,
          newDisplayOrder: newDisplayOrder
        });
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

// TODO: socketイベント（doc-add, doc-edit, doc-reorder等）のpayload構造がフロントと一致しているか要確認
// TODO: login時のuserIdの扱いがフロントとサーバでズレていないか要確認
