// src/hooks/useSocket.js

import { useEffect, useState } from 'react';

import { io } from 'socket.io-client';
const socket = io();

import useAppStore from './../store/appStore'; // Assuming you have an app store for userInfo
import usePostStore from './../store/postStore'; // Assuming you have a post store for managing posts

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {

  const [heightArray, setHeightArray] = useState([]);
  const { userInfo } = useAppStore((state) => state.userInfo);

  const addMessage = usePostStore((state) => state.addPost);
  const updatePost = usePostStore((state) => state.updatePost);
  const reorderPost = usePostStore((state) => state.reorderPost);

  useEffect(() => {
    const handleHeightChange = (data) => setHeightArray(data);
    const handleConnectOK = (userInfo) => {
      socket.emit('fetch-history');
      socket.emit('fetch-docs');
    };

    const handleHistory = (historyArray) => {
      historyArray.forEach((msg) => {
        addMessage(msg);
      });
    };

    const handleDocsHistory = (docs) => {
      docs.forEach((doc) => {
        addMessage(doc);
      });
    };

    const handleChatMessage = (data) => {
      addMessage(data);
    };

    // --- positive/negativeイベントを受信しstoreを更新 ---
    const handlePositive = (data) => {
      usePostStore.getState().updatePositive(data.id, data.positive, data.isPositive);
    };

    const handleNegative = (data) => {
      usePostStore.getState().updateNegative(data.id, data.negative, data.isNegative);
    };

    // --- Doc系イベント受信 ---
    const handleDocAdd = (payload) => {
      addMessage(payload);
    };

    const handleLockPermitted = (payload) => {
      // payload: { id, nickname}
      console.log('Lock-permitted payload:', payload);

    }

    const handleRowLocked = (payload) => {
      // payload: { id, nickname }
      console.log('Row-locked payload:', payload);

      // ロックされた行を特定し、UIを更新する処理を追加
      const { id, nickname } = payload;
      const LockedRow = document.querySelector(`[data-id="${id}"]`);
    }

    const handleLockNotAllowed = (payload) => {
      console.log('Lock-not-allowed payload:', payload);

    }

    const handleDocEdit = (payload) => {
      updatePost(payload.id, payload.newMsg, payload.nickname, payload.updatedAt);
    };

    const handleDocReorder = (posts) => {
      // サーバーから渡されたIDと新しいdisplayOrderでstoreを更新
      reorderPost(posts);
    };

    const handleDocDelete = (payload) => {
      usePostStore.getState().removePost(payload.id);
    };

    // イベントとハンドラの対応表
    const eventHandlers = {
      'heightChange': handleHeightChange,
      'connect OK': handleConnectOK,
      'history': handleHistory,
      'docs': handleDocsHistory,
      'chat-message': handleChatMessage,
      'positive': handlePositive,
      'negative': handleNegative,
      'doc-add': handleDocAdd,
      'Lock-permitted': handleLockPermitted,
      'row-locked': handleRowLocked,
      'Lock-not-allowed': handleLockNotAllowed,
      'doc-edit': handleDocEdit,
      'doc-reorder': handleDocReorder,
      'doc-delete': handleDocDelete,
    };

    // ループでイベントリスナーを登録
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // クリーンアップ
    return () => {
      // ループでイベントリスナーを解除
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event);
      });
    };

    // useEffectの依存配列は空にして、初回マウント時のみ実行
    // 万一useSocketが複数回呼ばれても、リスナーが多重登録されないため。
  }, []);

  // userIdが空文字列や不正な場合はundefinedにするユーティリティ
  const validUserId = (id) => {
    if (!id || typeof id !== 'string' || id.trim() === '' || !id.match(/^[a-fA-F0-9]{24}$/)) return undefined;
    return id;
  };

  const emitLoginName = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('login', userInfo);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'login',
      detail: { user: userInfo && userInfo.nickname }
    });
  };
  const emitHeightChange = (height) => socket.emit('heightChange', height);

  const emitChatMessage = (nickname, message, userId) => {
    socket.emit('chat-message', { nickname, message, userId });
    emitLog({
      userId: validUserId(userId),
      action: 'chat-message',
      detail: { nickname, message }
    });
  };

  // --- emitPositive/emitNegativeを実装 ---
  const emitPositive = (id) => {
    const { userInfo } = useAppStore.getState();
    if (!id || !userInfo.nickname) return;
    socket.emit('positive', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'positive',
      detail: { postId: id, nickname: userInfo.nickname }
    });
  };

  const emitNegative = (id) => {
    const { userInfo } = useAppStore.getState();
    if (!id || !userInfo.nickname) return;
    socket.emit('negative', {
      postId: id,
      userSocketId: socket.id,
      nickname: userInfo.nickname,
    });
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'negative',
      detail: { postId: id, nickname: userInfo.nickname }
    });
  };

  // --- Doc系のemit（サーバー連携実装） ---
  const emitDocAdd = (payload) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitDocAdd', payload);
    socket.emit('doc-add', payload);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-add',
      detail: payload
    });
  };

  // doc のロック要求
  const emitDemandLock = (data) => {
    const { userInfo } = useAppStore.getState();
    // data:{ `dc-${index}-${message?.displayOrder}-${message?.id}`, nickname }
    const { rowElementId, nickname } = data;
    console.log('emitDemandLock', { rowElementId, nickname });

    socket.emit('demand-lock', data);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-demand-lock',
      detail: data
    });

  };

  // doc の編集完了
  const emitDocEdit = (payload) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitDocEdit', payload);
    socket.emit('doc-edit', payload);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-edit',
      detail: payload
    });
  };

  const emitDocReorder = (payload) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitDocReorder', payload);
    socket.emit('doc-reorder', payload);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-reorder',
      detail: payload
    });
  };

  const emitDocDelete = (id) => {
    const { userInfo } = useAppStore.getState();
    socket.emit('doc-delete', { id });
    emitLog({ action: 'doc-delete', detail: { id } });
  };

  // --- 任意の操作ログをサーバに送信 ---
  const emitLog = (log) => {
    socket.emit('log', log);
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
    emitDemandLock,
    emitDocEdit,
    emitDocReorder,
    emitDocDelete,
    emitLog, // 追加
  };
}
