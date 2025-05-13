import { io } from 'socket.io-client';
const socket = io(); // サーバーに接続するためのSocket.IOクライアントを作成

// const socket = io.connect('https://chatment.onrender.com', {
//     reconnect: true,                // 自動再接続を有効にする
//     reconnectionAttempts: Infinity, // 無限回再接続を試みる
//     reconnectionDelay: 1000,        // 再接続前の待機時間（ミリ秒）
//     reconnectionDelayMax: 5000,     // 最大待機時間（ミリ秒）
//     timeout: 10000,                 // 接続試行のタイムアウト時間（ミリ秒）
// });

function emitLoginName(name) {
    socket.emit('login', name); // サーバーにログイン名を送信
}

socket.on('connect OK', (userInfo) => {
    console.log('Connected to server', userInfo); // デバッグ用
    socket.emit('fetch-history'); // サーバーに過去の投稿を要求
});

socket.on('history', (messages) => {
    console.log('History received:', messages); // デバッグ用
    // ここで受信したメッセージを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
});

function emitHeightChange(heightArray) {
    socket.emit('heightChange', heightArray); // サーバーに高さを送信
}

function emitChatMessage(msg) {
    socket.emit('chat-message', msg); // サーバーにチャットメッセージを送信
}

socket.on('chat-message', (msg) => {
    console.log('Chat message received:', msg); // デバッグ用
    // ここで受信したメッセージを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
});

function emitFav(id) {
    socket.emit('fav', id); // サーバーにお気に入りを送信
    console.log('Favorite emitted:', id); // デバッグ用
}

socket.on('fav', (post) => {
    console.log('Favorite received:', post); // デバッグ用
    // ここで受信したお気に入りを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
});

export { socket, emitLoginName, emitHeightChange, emitChatMessage };