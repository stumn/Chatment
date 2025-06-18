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
      console.log('Connected to server', userInfo);
      socket.emit('fetch-history');
    };
    const handleHistory = (historyArray) => {
      console.log('History received:', historyArray);
      historyArray.forEach((msg) => {
        addMessage(msg);
      });
    };
    
    const handleChatMessage = (msg) => {
      console.log('Chat message received:', msg);
      addMessage(msg);
    };

    const handleFav = (post) => {
      console.log('Favorite received:', post);
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

  const emitLoginName = (name) => socket.emit('login', name);
  const emitHeightChange = (height) => socket.emit('heightChange', height);
  
  const emitChatMessage = (msg) => {
    console.log('Emitting chat message:', msg);
    socket.emit('chat-message', msg);
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
