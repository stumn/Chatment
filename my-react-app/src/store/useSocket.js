// store/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io();

export default function useSocket() {
  const [heightArray, setHeightArray] = useState([]);

  useEffect(() => {
    const handleHeightChange = (data) => {
      setHeightArray(data);
    };

    socket.on('heightChange', handleHeightChange);
    return () => {
      socket.off('heightChange', handleHeightChange);
    };
  }, []);

  socket.on('connect OK', (userInfo) => {
    console.log('Connected to server', userInfo); // デバッグ用
    // setConnected(true); // 接続成功時に状態を更新
    socket.emit('fetch-history'); // サーバーに過去の投稿を要求
  });

  socket.on('history', (historyArray) => {
    console.log('History received:', historyArray); // デバッグ用
    // historyArray.forEach((history) => {
    //     addMessage(history.name, history.msg); // チャットストアにメッセージを追加
    // });
  });

  socket.on('chat-message', (msg) => {
    console.log('Chat message received:', msg); // デバッグ用
    // ここで受信したメッセージを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
  });

  socket.on('fav', (post) => {
    console.log('Favorite received:', post); // デバッグ用
    // ここで受信したお気に入りを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
  });

  const emitLoginName = (name) => socket.emit('login', name);
  const emitHeightChange = (height) => socket.emit('heightChange', height);

  const emitChatMessage = (msg) => {
    console.log('Emitting chat message:', msg); // デバッグ用
    socket.emit('chat-message', msg); // サーバーにチャットメッセージを送信
  }

  const emitFav = (id) => socket.emit('fav', id);

  return {
    emitLoginName,
    emitHeightChange,
    emitChatMessage,
    emitFav,
    heightArray,
  };
}
