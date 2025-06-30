// store/useSocket.js
import { useEffect, useState } from 'react';

import { io } from 'socket.io-client';
const socket = io();

import chatStore from './chatStore';

export default function useSocket() {

  const [heightArray, setHeightArray] = useState([]);

  const addMessage = chatStore((state) => state.addMessage);

  useEffect(() => {
    const handleHeightChange = (data) => setHeightArray(data);
    const handleConnectOK = (userInfo) => {
      socket.emit('fetch-history');
    };

    const handleHistory = (historyArray) => {
      historyArray.forEach((msg) => {
        addMessage(msg);
      });
    };

    const handleChatMessage = (data) => {
      addMessage(data);
    };

    const handleFav = (post) => {
    };

    socket.on('heightChange', handleHeightChange);
    socket.on('connect OK', handleConnectOK);
    socket.on('history', handleHistory);
    socket.on('chat-message', handleChatMessage);
    socket.on('fav', handleFav);

    // クリーンアップでリスナー解除
    return () => {
      socket.off('heightChange', handleHeightChange);
      socket.off('connect OK', handleConnectOK);
      socket.off('history', handleHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('fav', handleFav);
    };
  }, []);

  const emitLoginName = (userInfo) => socket.emit('login', userInfo);
  const emitHeightChange = (height) => socket.emit('heightChange', height);

  const emitChatMessage = (nickname, message) => {
    socket.emit('chat-message', { nickname, message });
  };

  const emitFav = (id) => socket.emit('fav', id);

  return {
    emitLoginName,
    emitHeightChange,
    emitChatMessage,
    emitFav,
    heightArray,
  };
}
