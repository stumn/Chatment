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
    console.log('Login name emitted:', name); // デバッグ用
}

socket.on('connect', (userInfo) => {
    console.log('Connected to server', userInfo); // デバッグ用
});

function emitHeightChange(heightArray) {
    socket.emit('heightChange', heightArray); // サーバーに高さを送信
    console.log('Height change emitted:', heightArray); // デバッグ用
}

export { socket, emitLoginName, emitHeightChange };