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
  addDocRow, getPostsByDisplayOrder, updateDisplayOrder,
  saveLog // 追加
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

        // displayOrderを計算
        const displayOrder = await getNextDisplayOrder();
        console.log('Calculated displayOrder:', displayOrder);

        // チャットメッセージをDBに保存
        const p = await SaveChatMessage(nickname, message, userId, displayOrder); // userIdも保存

        // 全クライアントに新しいメッセージをブロードキャスト
        io.emit('chat-message', p);

        // --- ログ記録 ---
        saveLog({ userId, action: 'chat-message', detail: { nickname, message, displayOrder } });
      } catch (e) { console.error(e); }
    });

    function getNextDisplayOrder() {
      return new Promise(async (resolve, reject) => {
        try {
          const posts = await getPostsByDisplayOrder();
          const lastPost = posts[posts.length - 1];
          const nextOrder = lastPost ? lastPost.displayOrder + 1 : 1;
          resolve(nextOrder);
        } catch (error) {
          reject(error);
        }
      });
    }

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
        // --- ログ記録 ---
        saveLog({ userId: post.userId, action: 'positive', detail: { postId, userSocketId, nickname } });
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
        // --- ログ記録 ---
        saveLog({ userId: post.userId, action: 'negative', detail: { postId, userSocketId, nickname } });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 行追加 ---
    socket.on('doc-add', async (payload) => {
      try {
        console.log('🐟doc-add(これは1つ上のメッセージ情報):', payload);

        let displayOrder = payload.displayOrder;
        const posts = await getPostsByDisplayOrder(); // displayOrderでソート済みのpostsを取得

        // payload.displayOrderが指定されている場合はそれを優先
        if (displayOrder === undefined || !Number.isFinite(displayOrder)) {
          console.log('displayOrderが未指定または不正な値:', displayOrder);

          // displayOrderが未指定の場合、挿入位置に基づいて計算
          if (posts.length === 0) {
            displayOrder = 1; // 投稿が一つもない場合は1
            console.log('postsが空なのでdisplayOrderを1に設定');
          }
          else if (payload.insertAfterId) { // 特定のIDの後に挿入する場合
            const targetPostIndex = posts.findIndex(p => p.id === payload.insertAfterId);
            console.log('insertAfterIdが指定されている:', payload.insertAfterId, 'targetPostIndex:', targetPostIndex);

            if (targetPostIndex !== -1) {
              const prev = posts[targetPostIndex];
              const next = posts[targetPostIndex + 1];
              console.log('prev:', prev, 'next:', next);

              if (next) {
                displayOrder = (prev.displayOrder + next.displayOrder) / 2;
                console.log('次の投稿があるので、displayOrderを平均値に設定:', displayOrder);
              }
              else {
                displayOrder = prev.displayOrder + 1;
                console.log('次の投稿がないので、displayOrderを前の投稿の次に設定:', displayOrder);
              }
            } else {
              // 対象IDが見つからない場合は末尾に追加
              displayOrder = posts[posts.length - 1].displayOrder + 1;
              console.log('insertAfterIdが見つからないので、末尾に追加:', displayOrder);
            }
          } else { // insertAfterIdが指定されていない場合は末尾に追加
            displayOrder = posts[posts.length - 1].displayOrder + 1;
            console.log('insertAfterIdが指定されていないので、末尾に追加:', displayOrder);
          }
        }

        // 最終チェック: NaNや不正値なら最大+1または1
        if (!Number.isFinite(displayOrder)) {
          displayOrder = posts.length > 0 ? posts[posts.length - 1].displayOrder + 1 : 1;
          console.log('displayOrderが不正な値だったので、最大+1または1に設定:', displayOrder);
        }

        // DB保存
        const newPost = await addDocRow({
          nickname: payload.nickname,
          msg: payload.msg || '',
          displayOrder: calculateDisplayOrder(displayOrder, posts),
        });

        console.log('新規行追加:', newPost);

        // 全クライアントに新規行追加をブロードキャスト
        const data = {
          id: newPost.id,
          nickname: newPost.nickname,
          msg: newPost.msg,
          displayOrder: newPost.displayOrder
        };

        console.log('doc-add emit data:', data);
        io.emit('doc-add', data);
        // --- ログ記録 ---
        saveLog({ userId: newPost.userId, action: 'doc-add', detail: data });
      } catch (e) { console.error(e); }
    });

    // 関数: displayOrderの計算
    function calculateDisplayOrder(displayOrder, posts) {
      // 前後の投稿の浮動小数点数を求める

      // displayOrderが今回挿入したい新規行の1つ上
      const prev = displayOrder;

      // displayOrderが今回挿入したい新規行の1つ下
      const next = posts.find(p => p.displayOrder > displayOrder);

      console.log('calculateDisplayOrder:', { displayOrder, prev, next });

      if (prev && next) {
        // 前後の投稿が存在する場合、平均値を取る
        return (prev + next.displayOrder) / 2;
      }

      // 前の投稿が存在する場合、次の投稿の前に挿入
      if (prev) {
        return prev + 1;
      }

      // 次の投稿が存在する場合、次の投稿の前に挿入
      if (next) {
        return next.displayOrder - 1;
      }

      // どちらも存在しない場合は1を返す
      return 1;
    }

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
        io.emit('doc-edit', payload);
        // --- ログ記録 ---
        saveLog({ userId: null, action: 'doc-edit', detail: payload });
      } catch (e) { console.error(e); }
    });

    // --- Doc系: 並び替え ---
    socket.on('doc-reorder', async (payload) => {

      try {
        console.log('doc-reorder:', payload);
        const {
          nickname,
          movedPostId,
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        } = payload;

        console.log('doc-reorder payload:', {
          nickname,
          movedPostId,
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        });

        // beforeとafter から新しいdisplayOrderを計算
        const newDisplayOrder = calculateNewDisplayOrder(
          movedPostDisplayOrder,
          beforePostDisplayOrder,
          afterPostDisplayOrder
        );

        // DB更新
        await updateDisplayOrder(movedPostId, newDisplayOrder);

        const posts = await getPostsByDisplayOrder(movedPostDisplayOrder); // displayOrderでソート済みのpostsを取得
        io.emit('doc-reorder', posts);
        // --- ログ記録 ---
        saveLog({ userId: null, action: 'doc-reorder', detail: payload });
      } catch (e) { console.error(e); }
    });
  });

  function calculateNewDisplayOrder(movedDisplayOrder, beforePostDisplayOrder, afterPostDisplayOrder) {
    // displayOrderの計算ロジックをここに実装
    console.log('calculateDisplayOrder:', {
      movedDisplayOrder,
      beforePostDisplayOrder,
      afterPostDisplayOrder
    });

    if (beforePostDisplayOrder && afterPostDisplayOrder) {
      console.log('前後の投稿が存在する場合、平均値を取る');
      // 前後の投稿が存在する場合、平均値を取る
      return (beforePostDisplayOrder + afterPostDisplayOrder) / 2;
    }

    // 前の投稿が存在する場合、次の投稿の前に挿入
    if (beforePostDisplayOrder) {
      return beforePostDisplayOrder + 1;
    }

    // 次の投稿が存在する場合、次の投稿の前に挿入
    if (afterPostDisplayOrder) {
      return afterPostDisplayOrder - 1;
    }

    // どちらも存在しない場合は1を返す
    return 1;
  }

  // --- クライアントからの任意操作ログを受信して保存 ---
  socket.on('log', (log) => {
    // log: { userId, action, detail }
    saveLog(log);
  });

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
