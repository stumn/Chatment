// src/hooks/useSocket.js

import { useEffect, useState } from 'react';

import { io } from 'socket.io-client';
// ❌ 問題: socketインスタンスがモジュールスコープで作成されているため、
// アプリが再マウントされてもsocket接続が残り、メモリリークの原因になる可能性があります
// ✅ 修正案: useEffect内でsocket接続を管理し、クリーンアップで切断する
const socket = io();

import useAppStore from './../store/appStore'; // Assuming you have an app store for userInfo
import usePostStore from './../store/postStore'; // Assuming you have a post store for managing posts
import useRoomStore from './../store/roomStore'; // Room store for managing room state

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {

  const [heightArray, setHeightArray] = useState([]);
  const userInfo = useAppStore((state) => state.userInfo);

  const addMessage = usePostStore((state) => state.addPost);
  const updatePost = usePostStore((state) => state.updatePost);
  const reorderPost = usePostStore((state) => state.reorderPost);

  const setChangeState = usePostStore((state) => state.setChangeState);

  useEffect(() => {
    // ❌ 問題: Socket接続エラーやネットワーク断線時のエラーハンドリングがありません
    // ✅ 修正案: エラーハンドリングを追加
    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      // TODO: ユーザーにエラーメッセージを表示する仕組みを追加
    };

    const handleDisconnect = (reason) => {
      console.warn('Socket disconnected:', reason);
      // TODO: 再接続の試行やユーザー通知の仕組みを追加
    };

    const handleHeightChange = (data) => setHeightArray(data);
    const handleConnectOK = (userInfo) => {
      socket.emit('fetch-history');
      socket.emit('fetch-docs');
    };

    const handleHistory = (historyArray) => {
      historyArray.forEach((msg) => {
        // 履歴データは新規作成ではないのでfalse
        addMessage(msg, false);
      });
    };

    const handleDocsHistory = (docs) => {
      docs.forEach((doc) => {
        // 履歴データは新規作成ではないのでfalse
        addMessage(doc, false);
      });
    };

    const handleChatMessage = (data) => {
      console.log('💬 [useSocket] チャットメッセージ受信:', data);
      
      // ルームメッセージの場合、現在のアクティブルームと一致するかチェック
      if (data.roomId) {
        const currentRoomId = useRoomStore.getState().activeRoomId;
        console.log(`🏠 [useSocket] ルームメッセージ受信 - 送信先: ${data.roomId}, 現在のルーム: ${currentRoomId}`);
        
        if (data.roomId !== currentRoomId) {
          console.log('🚫 [useSocket] 異なるルームのメッセージのため無視');
          return; // 現在のルームと異なる場合は表示しない
        }
        
        // ルーム別メッセージ履歴に保存
        useRoomStore.getState().addMessageToRoom(data.roomId, data);
      }
      
      // チャットメッセージとして追加（新規作成として扱う）
      addMessage(data, true);
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
      console.log('handleDocAdd called with payload:', payload);
      // 新規作成として変更状態を記録
      addMessage(payload, true); // 第2引数をtrueにして新規作成であることを示す
      console.log('addMessage called with isNewlyCreated=true');
    };

    const handleLockPermitted = (payload) => {
      // payload: { id, nickname}
      console.log('Lock-permitted payload:', payload);
      // ロック許可時のUI更新処理を追加
      // 自分がロックを取得した場合なので、編集可能状態にする
      // この処理はコンポーネント側で handle する
    }

    const handleRowLocked = (payload) => {
      // payload: { id, nickname }
      console.log('Row-locked payload:', payload);

      // ロック状態をStoreで管理
      usePostStore.getState().lockRow(payload.id, {
        nickname: payload.nickname,
        lockedAt: new Date().toISOString()
      });
    }

    // ロック解除イベントハンドラー
    const handleRowUnlocked = (payload) => {
      // payload: { id, postId, reason? }
      console.log('Row-unlocked payload:', payload);

      // ストアからロック状態を削除
      usePostStore.getState().unlockRow(payload.id);
    };

    const handleLockNotAllowed = (payload) => {
      console.log('Lock-not-allowed payload:', payload);

    }

    const handleDocEdit = (payload) => {
      updatePost(payload.id, payload.newMsg, payload.nickname, payload.updatedAt);
    };

    const handleDocReorder = (payload) => {
      // サーバーからの新しい形式に対応
      if (payload.posts && payload.reorderInfo) {
        // サーバーから渡されたIDと新しいdisplayOrderでstoreを更新
        reorderPost(payload.posts);

        // 追加: 並び替えされた投稿の変更状態を記録（全クライアントで表示）
        setChangeState(
          payload.reorderInfo.movedPostId,
          'reordered',
          payload.reorderInfo.executorNickname
        );
      } else {
        // 旧形式との互換性維持
        reorderPost(payload);
      }
    };

    const handleDocDelete = (payload) => {
      usePostStore.getState().removePost(payload.id);
    };

    // --- Room関連のイベントハンドラー ---
    const handleRoomJoined = (data) => {
      // data: { roomId, roomInfo, participants }
      console.log('Room joined:', data);
      
      // 参加者数を更新
      if (data.roomInfo && data.roomInfo.participantCount) {
        useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.roomInfo.participantCount);
      }
      
      // 現在のルームを更新
      useRoomStore.getState().setActiveRoom(data.roomId);
      
      // postStoreの表示をルーム用に切り替え（キャッシュから復元）
      const cachedMessages = useRoomStore.getState().getRoomMessages(data.roomId);
      if (cachedMessages.length > 0) {
        console.log(`📋 [useSocket] ${data.roomId}のキャッシュされたメッセージを復元:`, cachedMessages.length, '件');
        // キャッシュされたメッセージを表示用に追加
        usePostStore.getState().switchToRoom(data.roomId);
        cachedMessages.forEach((msg) => {
          addMessage(msg, false); // 履歴データなのでfalse
        });
      } else {
        // キャッシュがない場合は履歴を要求
        console.log(`📚 [useSocket] ${data.roomId}のキャッシュがないため履歴を要求`);
        emitFetchRoomHistory(data.roomId);
      }
      
      emitLog({
        userId: validUserId(userInfo && userInfo._id),
        userNickname: userInfo && userInfo.nickname,
        action: 'room-joined',
        detail: { roomId: data.roomId, participantCount: data.roomInfo?.participantCount }
      });
    };

    const handleRoomLeft = (data) => {
      // data: { roomId, participantCount }
      console.log('Room left:', data);
      
      // 参加者数を更新
      useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);
      
      emitLog({
        userId: validUserId(userInfo && userInfo._id), 
        userNickname: userInfo && userInfo.nickname,
        action: 'room-left',
        detail: { roomId: data.roomId, participantCount: data.participantCount }
      });
    };

    const handleUserJoined = (data) => {
      // data: { roomId, userId, nickname, participantCount }
      console.log('User joined room:', data);
      
      // 参加者数を更新
      useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);
      
      // 通知メッセージをチャットに表示（オプション）
      const systemMessage = {
        id: `system-${Date.now()}-${Math.random()}`,
        nickname: 'システム',
        msg: `${data.nickname}さんがルームに参加しました`,
        roomId: data.roomId,
        isSystemMessage: true,
        createdAt: new Date().toISOString()
      };
      
      // システムメッセージとして追加
      addMessage(systemMessage, true);
    };

    const handleUserLeft = (data) => {
      // data: { roomId, userId, nickname, participantCount }
      console.log('User left room:', data);
      
      // 参加者数を更新
      useRoomStore.getState().updateRoomParticipantCount(data.roomId, data.participantCount);
      
      // 通知メッセージをチャットに表示（オプション）
      const systemMessage = {
        id: `system-${Date.now()}-${Math.random()}`,
        nickname: 'システム',
        msg: `${data.nickname}さんがルームから退出しました`,
        roomId: data.roomId,
        isSystemMessage: true,
        createdAt: new Date().toISOString()
      };
      
      // システムメッセージとして追加
      // addMessage(systemMessage, true);
      console.log('User left room:', systemMessage);
    };

    const handleRoomError = (data) => {
      // data: { error, roomId, message }
      console.error('Room error:', data);
      
      // エラーメッセージを表示
      const errorMessage = {
        id: `error-${Date.now()}-${Math.random()}`,
        nickname: 'エラー',
        msg: `ルームエラー: ${data.message || data.error}`,
        roomId: data.roomId,
        isSystemMessage: true,
        isError: true,
        createdAt: new Date().toISOString()
      };
      
      addMessage(errorMessage, true);
    };

    const handleRoomList = (data) => {
      // data: { rooms: [{ id, name, description, participantCount }] }
      console.log('Room list received:', data);
      
      if (data.rooms && Array.isArray(data.rooms)) {
        useRoomStore.getState().setRooms(data.rooms);
      }
    };

    const handleRoomInfo = (data) => {
      // data: { roomId, roomInfo: { name, description, participantCount, participants } }
      console.log('Room info received:', data);
      
      if (data.roomInfo) {
        // 特定のルームの情報を更新
        const currentRooms = useRoomStore.getState().rooms;
        const updatedRooms = currentRooms.map(room => 
          room.id === data.roomId ? { ...room, ...data.roomInfo } : room
        );
        useRoomStore.getState().setRooms(updatedRooms);
      }
    };

    // ルーム履歴取得のハンドラー
    const handleRoomHistory = (data) => {
      // data: { roomId, messages: [...], startTime? }
      const endTime = performance.now();
      const loadTime = data.startTime ? endTime - data.startTime : 0;
      
      console.log(`📚 [useSocket] ${data.roomId}の履歴を受信:`, data.messages.length, '件');
      if (loadTime > 0) {
        console.log(`⏱️ [useSocket] 履歴読み込み時間: ${loadTime.toFixed(2)}ms`);
      }
      
      if (data.roomId && data.messages && Array.isArray(data.messages)) {
        // ルームストアに履歴を設定
        useRoomStore.getState().setRoomMessages(data.roomId, data.messages);
        useRoomStore.getState().setRoomHistoryLoaded(data.roomId, true);
        
        // 現在のアクティブルームの履歴の場合、postStoreにも追加
        const currentRoomId = useRoomStore.getState().activeRoomId;
        if (data.roomId === currentRoomId) {
          data.messages.forEach((msg) => {
            addMessage(msg, false); // 履歴データなのでfalse
          });
        }
        
        // パフォーマンスログ
        emitLog({
          userId: validUserId(useAppStore.getState().userInfo?._id),
          userNickname: useAppStore.getState().userInfo?.nickname,
          action: 'room-history-loaded',
          detail: { 
            roomId: data.roomId, 
            messageCount: data.messages.length,
            loadTimeMs: loadTime 
          }
        });
      }
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
      'row-unlocked': handleRowUnlocked,
      'Lock-not-allowed': handleLockNotAllowed,
      'doc-edit': handleDocEdit,
      'doc-reorder': handleDocReorder,
      'doc-delete': handleDocDelete,
      // Room関連のイベント
      'room-joined': handleRoomJoined,
      'room-left': handleRoomLeft,
      'user-joined': handleUserJoined,
      'user-left': handleUserLeft,
      'room-error': handleRoomError,
      'room-list': handleRoomList,
      'room-info': handleRoomInfo,
      'room-history': handleRoomHistory,
      // エラーハンドリング
      'connect_error': handleConnectError,
      'disconnect': handleDisconnect,
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

  const emitChatMessage = (nickname, message, userId, roomId = null) => {
    const messageData = {
      nickname,
      message,
      userId,
      ...(roomId && { roomId }) // roomIdがある場合のみ追加
    };
    
    console.log('💬 [useSocket] チャットメッセージ送信:', messageData);
    socket.emit('chat-message', messageData);
    
    emitLog({
      userId: validUserId(userId),
      action: 'chat-message',
      detail: { nickname, message, roomId }
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

  // ロック解除
  const emitUnlockRow = (data) => {
    const { userInfo } = useAppStore.getState();
    console.log('emitUnlockRow', data);

    socket.emit('unlock-row', data);

    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo.nickname,
      action: 'doc-unlock-row',
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

  // --- Room関連のemit関数 ---
  const emitJoinRoom = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId || !userInfo) return;
    
    const joinData = {
      roomId,
      userId: userInfo._id,
      nickname: userInfo.nickname,
      userInfo: userInfo
    };
    
    console.log('Joining room:', joinData);
    socket.emit('join-room', joinData);
    
    emitLog({
      userId: validUserId(userInfo._id),
      userNickname: userInfo.nickname,
      action: 'join-room',
      detail: { roomId, nickname: userInfo.nickname }
    });
  };

  const emitLeaveRoom = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId || !userInfo) return;
    
    const leaveData = {
      roomId,
      userId: userInfo._id,
      nickname: userInfo.nickname
    };
    
    console.log('Leaving room:', leaveData);
    socket.emit('leave-room', leaveData);
    
    emitLog({
      userId: validUserId(userInfo._id),
      userNickname: userInfo.nickname,
      action: 'leave-room',
      detail: { roomId, nickname: userInfo.nickname }
    });
  };

  const emitGetRoomList = () => {
    const { userInfo } = useAppStore.getState();
    console.log('Requesting room list');
    socket.emit('get-room-list');
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'get-room-list',
      detail: {}
    });
  };

  const emitGetRoomInfo = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId) return;
    
    console.log('Requesting room info for:', roomId);
    socket.emit('get-room-info', { roomId });
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'get-room-info',
      detail: { roomId }
    });
  };

  // ルーム履歴を取得する関数
  const emitFetchRoomHistory = (roomId) => {
    const { userInfo } = useAppStore.getState();
    if (!roomId) return;
    
    // 既に履歴が読み込み済みの場合はスキップ
    if (useRoomStore.getState().isRoomHistoryLoaded(roomId)) {
      console.log(`📚 [useSocket] ${roomId}の履歴は既に読み込み済み`);
      return;
    }
    
    console.log(`📚 [useSocket] ${roomId}の履歴を要求`);
    const startTime = performance.now(); // パフォーマンス測定開始
    
    socket.emit('fetch-room-history', { roomId, startTime });
    
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'fetch-room-history',
      detail: { roomId, startTime }
    });
  };

  return {
    // 基本
    emitLoginName,
    emitHeightChange,
    heightArray,
    socketId: socket.id,

    // chat関連のemit関数
    emitChatMessage,
    emitPositive,
    emitNegative,

    // Doc系のemit関数　// roomIdを伝える必要あり
    emitDocAdd,
    emitDemandLock,
    emitUnlockRow,
    emitDocEdit,
    emitDocReorder,
    emitDocDelete,

    // 任意の操作ログをサーバに送信
    emitLog,

    // Room関連の関数
    emitJoinRoom,
    emitLeaveRoom,
    emitGetRoomList,
    emitGetRoomInfo,
    emitFetchRoomHistory,
  };
}
