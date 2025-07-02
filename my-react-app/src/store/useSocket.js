// TODO: Doc系のsocket通信（emitDocAdd, emitDocEdit, emitDocReorder等）を実装し、chatStoreのcustomAddMessage, updateMessage, reorderMessagesから呼び出すこと
// 例: emitDocAdd({ nickname, msg, index }) など
// TODO: サーバー側にもdoc-add, doc-edit, doc-reorder等のsocketイベントを実装すること

// store/useSocket.js
import { useEffect, useState } from 'react';

import { io } from 'socket.io-client';
const socket = io();

import chatStore from './chatStore';
import useAppStore from './appStore';

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {

  const [heightArray, setHeightArray] = useState([]);
  const { userInfo } = useAppStore();

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

    // --- positive/negativeイベントを受信しstoreを更新 ---
    const handlePositive = (data) => {
      chatStore.getState().updatePositive(data.id, data.positive, data.isPositive);
    };
    const handleNegative = (data) => {
      chatStore.getState().updateNegative(data.id, data.negative, data.isNegative);
    };

    socket.on('heightChange', handleHeightChange);
    socket.on('connect OK', handleConnectOK);
    socket.on('history', handleHistory);
    socket.on('chat-message', handleChatMessage);
    socket.on('positive', handlePositive);
    socket.on('negative', handleNegative);

    // クリーンアップでリスナー解除
    return () => {
      socket.off('heightChange', handleHeightChange);
      socket.off('connect OK', handleConnectOK);
      socket.off('history', handleHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('positive', handlePositive);
      socket.off('negative', handleNegative);
    };
    // 依存配列は[]で固定。useSocketが複数回呼ばれてもリスナーが多重登録されないようにする。
  }, []);

  const emitLoginName = (userInfo) => socket.emit('login', userInfo);
  const emitHeightChange = (height) => socket.emit('heightChange', height);

  const emitChatMessage = (nickname, message, userId) => {
    socket.emit('chat-message', { nickname, message, userId });
  };

  // --- emitPositive/emitNegativeを実装 ---
  const emitPositive = (id) => {
    if (!id || !userInfo.nickname) return;
    socket.emit('positive', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
  };
  const emitNegative = (id) => {
    if (!id || !userInfo.nickname) return;
    socket.emit('negative', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
  };

  // --- Doc系のemit（サーバー連携実装） ---
  const emitDocAdd = (payload) => {
    socket.emit('doc-add', payload);
  };
  const emitDocEdit = (payload) => {
    socket.emit('doc-edit', payload);
  };
  const emitDocReorder = (payload) => {
    socket.emit('doc-reorder', payload);
  };

  return {
    emitLoginName,
    emitHeightChange,
    emitChatMessage,
    emitPositive,
    emitNegative,
    heightArray,
    socketId: socket.id,
    emitDocAdd,
    emitDocEdit,
    emitDocReorder,
  };
}
