// src/hooks/useSocket.js (新しい統合版)

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// ハンドラーのインポート
import { useBasicHandlers } from '../spaces/socket/handlers/useBasicHandlers';
import { useChatHandlers } from '../spaces/socket/handlers/useChatHandlers';
import { useDocHandlers } from '../spaces/socket/handlers/useDocHandlers';
import { useLockHandlers } from '../spaces/socket/handlers/useLockHandlers';
import { useRoomHandlers } from '../spaces/socket/handlers/useRoomHandlers';

// エミッターのインポート
import { useBasicEmitters } from '../spaces/socket/emitters/useBasicEmitters';
import { useChatEmitters } from '../spaces/socket/emitters/useChatEmitters';
import { useDocEmitters } from '../spaces/socket/emitters/useDocEmitters';
import { useRoomEmitters } from '../spaces/socket/emitters/useRoomEmitters';

// ユーティリティのインポート
import { createEmitLog } from '../spaces/socket/utils/socketUtils';
import { createEventHandlerMap } from '../spaces/socket/utils/eventMap';

const socket = io();

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {
  const [heightArray, setHeightArray] = useState([]);

  // emitLog関数を作成
  const emitLog = createEmitLog(socket);

  // 各ハンドラーフックを呼び出し
  const basicHandlers = useBasicHandlers(socket);
  const chatHandlers = useChatHandlers(emitLog);
  const docHandlers = useDocHandlers(emitLog);
  const lockHandlers = useLockHandlers(emitLog);
  const roomHandlers = useRoomHandlers(emitLog);

  // 各エミッターフックを呼び出し
  const basicEmitters = useBasicEmitters(socket, emitLog);
  const chatEmitters = useChatEmitters(socket, emitLog);
  const docEmitters = useDocEmitters(socket, emitLog);
  const roomEmitters = useRoomEmitters(socket, emitLog);

  useEffect(() => {
    // heightChangeハンドラーは状態更新のため、ここで定義
    const handleHeightChange = (data) => setHeightArray(data);

    // 認証完了後の処理を拡張
    const enhancedHandleConnectOK = (userInfo) => {
      // 既存の処理を実行
      basicHandlers.handleConnectOK(userInfo);
      
      // 認証完了後にルーム関連の処理を実行
      console.log('🔐 認証完了後の処理を開始:', userInfo);
      
      // ルーム一覧を取得（一覧取得後にルーム参加処理は別途ハンドラーで実行）
      roomEmitters.emitGetRoomList();
    };

    // ルーム一覧受信時に最初のルームに自動参加する処理を拡張
    const enhancedHandleRoomList = (data) => {
      // 既存の処理を実行
      roomHandlers.handleRoomList(data);
      
      // ルーム一覧を受信したら、最初のルームに自動参加
      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        const firstRoom = data.rooms[0];
        console.log('🚀 最初のルームに自動参加:', firstRoom.id, firstRoom.name);
        roomEmitters.emitJoinRoom(firstRoom.id);
      } else {
        console.warn('⚠️ 利用可能なルームが見つかりませんでした');
      }
    };

    // すべてのハンドラーをマージ
    const allHandlers = {
      ...basicHandlers,
      handleConnectOK: enhancedHandleConnectOK, // 拡張されたハンドラーを使用
      ...chatHandlers,
      ...docHandlers,
      ...lockHandlers,
      ...roomHandlers,
      handleRoomList: enhancedHandleRoomList, // 拡張されたルーム一覧ハンドラーを使用
      handleHeightChange, // 状態更新のため個別定義
    };

    // イベントハンドラーマップを作成
    const eventHandlers = createEventHandlerMap(allHandlers);

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

  }, [basicHandlers, chatHandlers, docHandlers, lockHandlers, roomHandlers, roomEmitters]);

  return {
    // 基本
    ...basicEmitters,
    heightArray,
    socketId: socket.id,

    // chat関連のemit関数
    ...chatEmitters,

    // Doc系のemit関数
    ...docEmitters,

    // Room関連の関数
    ...roomEmitters,

    // 任意の操作ログをサーバに送信
    emitLog,
  };
}
