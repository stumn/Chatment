import { useEffect, useRef } from 'react';
import useRoomStore from '../store/roomStore';
import useAppStore from '../store/appStore';

// ルーム機能用のWebSocket通信を管理するカスタムフック
const useRoomSocket = () => {
  const socketRef = useRef(null);
  const {
    setRooms,
    setActiveRoom,
    addMessageToRoom,
    setRoomMessages,
    setRoomParticipants,
    addParticipantToRoom,
    removeParticipantFromRoom,
    activeRoomId
  } = useRoomStore();
  
  const { userInfo } = useAppStore();

  // WebSocket接続を初期化
  const connectSocket = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // 既に接続済み
    }

    try {
      // サーバーのWebSocketエンドポイントに接続
      socketRef.current = new WebSocket('ws://localhost:3000');
      
      socketRef.current.onopen = () => {
        console.log('Room WebSocket connected');
        
        // 接続時にユーザー情報を送信
        if (userInfo.userId) {
          sendMessage('user_authenticate', {
            userId: userInfo.userId,
            nickname: userInfo.nickname,
            status: userInfo.status,
            ageGroup: userInfo.ageGroup
          });
        }
        
        // ルーム一覧を要求
        sendMessage('get_rooms');
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('Room WebSocket disconnected');
        // 再接続を試行（5秒後）
        setTimeout(() => {
          if (userInfo.userId) {
            connectSocket();
          }
        }, 5000);
      };

      socketRef.current.onerror = (error) => {
        console.error('Room WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  // メッセージを送信
  const sendMessage = (type, data = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type,
        ...data,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  // サーバーからのメッセージを処理
  const handleMessage = (data) => {
    switch (data.type) {
      case 'rooms_list':
        // ルーム一覧を受信
        setRooms(data.rooms || []);
        break;

      case 'room_messages':
        // ルームのメッセージ履歴を受信
        if (data.roomId && data.messages) {
          setRoomMessages(data.roomId, data.messages);
        }
        break;

      case 'room_participants':
        // ルームの参加者一覧を受信
        if (data.roomId && data.participants) {
          setRoomParticipants(data.roomId, data.participants);
        }
        break;

      case 'new_message':
        // 新しいメッセージを受信
        if (data.roomId && data.message) {
          addMessageToRoom(data.roomId, data.message);
        }
        break;

      case 'user_joined':
        // ユーザーがルームに参加
        if (data.roomId && data.user) {
          addParticipantToRoom(data.roomId, data.user);
        }
        break;

      case 'user_left':
        // ユーザーがルームから退出
        if (data.roomId && data.userId) {
          removeParticipantFromRoom(data.roomId, data.userId);
        }
        break;

      case 'room_joined':
        // ルーム参加成功
        if (data.roomId) {
          setActiveRoom(data.roomId);
          // メッセージ履歴と参加者を要求
          sendMessage('get_room_messages', { roomId: data.roomId });
          sendMessage('get_room_participants', { roomId: data.roomId });
        }
        break;

      case 'error':
        console.error('Room WebSocket error:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // ルームに参加
  const joinRoom = (roomId) => {
    if (!userInfo.userId) {
      console.warn('User not authenticated');
      return;
    }

    sendMessage('join_room', {
      roomId,
      userId: userInfo.userId,
      nickname: userInfo.nickname
    });
  };

  // ルームから退出
  const leaveRoom = (roomId) => {
    if (!userInfo.userId) {
      return;
    }

    sendMessage('leave_room', {
      roomId,
      userId: userInfo.userId
    });
  };

  // メッセージを送信
  const sendRoomMessage = (messageData) => {
    if (!userInfo.userId || !messageData.roomId) {
      console.warn('Cannot send message: user not authenticated or room not specified');
      return;
    }

    sendMessage('send_message', {
      roomId: messageData.roomId,
      message: messageData.message,
      userId: userInfo.userId,
      nickname: userInfo.nickname
    });
  };

  // ユーザーがログインしている場合のみWebSocket接続
  useEffect(() => {
    if (userInfo.userId) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [userInfo.userId]);

  // アクティブルームが変更された時の処理
  useEffect(() => {
    if (activeRoomId && userInfo.userId) {
      // 現在のルームから退出（必要に応じて）
      // 新しいルームに参加
      joinRoom(activeRoomId);
    }
  }, [activeRoomId, userInfo.userId]);

  return {
    sendRoomMessage,
    joinRoom,
    leaveRoom,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN
  };
};

export default useRoomSocket;
