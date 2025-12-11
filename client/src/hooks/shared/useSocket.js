// src/hooks/useSocket.js (新しい統合版)

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// ハンドラーのインポート
import { useBasicHandlers } from '../spaces/handlers/useBasicHandlers';
import { useChatHandlers } from '../spaces/handlers/useChatHandlers';
import { useDocHandlers } from '../spaces/handlers/useDocHandlers';
import { useLockHandlers } from '../spaces/handlers/useLockHandlers';
import { useRoomHandlers } from '../spaces/handlers/useRoomHandlers';

// エミッターのインポート
import { useBasicEmitters } from '../spaces/emitters/useBasicEmitters';
import { useChatEmitters } from '../spaces/emitters/useChatEmitters';
import { useDocEmitters } from '../spaces/emitters/useDocEmitters';
import { useRoomEmitters } from '../spaces/emitters/useRoomEmitters';

// ユーティリティのインポート
import { createEmitLog } from '../spaces/socketUtils/socketUtils';
import { createEventHandlerMap } from '../spaces/socketUtils/eventMap';

const socket = io();

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {
  const [heightArray, setHeightArray] = useState([]);

  // emitLog関数を作成
  const emitLog = createEmitLog(socket);

  // 各エミッターフックを呼び出し
  const basicEmitters = useBasicEmitters(socket, emitLog);
  const chatEmitters = useChatEmitters(socket, emitLog);
  const docEmitters = useDocEmitters(socket, emitLog);
  const roomEmitters = useRoomEmitters(socket, emitLog);

  // 各ハンドラーフックを呼び出し
  const basicHandlers = useBasicHandlers(socket);
  const chatHandlers = useChatHandlers(emitLog);
  const docHandlers = useDocHandlers(emitLog);
  const lockHandlers = useLockHandlers(emitLog);
  const roomHandlers = useRoomHandlers(emitLog, roomEmitters); // roomEmittersを渡す

  useEffect(() => {
    // heightChangeハンドラーは状態更新のため、ここで定義
    const handleHeightChange = (data) => setHeightArray(data);

    // 認証完了後の処理を拡張
    const enhancedHandleConnectOK = (userInfo) => {
      // 既存の処理を実行
      basicHandlers.handleConnectOK(userInfo);

      // 認証完了後にルーム関連の処理を実行
      // ルーム一覧を取得（一覧取得後にルーム参加処理は別途ハンドラーで実行）
      roomEmitters.emitGetRoomList();
    };

    // すべてのハンドラーをマージ
    const allHandlers = {
      ...basicHandlers,
      handleConnectOK: enhancedHandleConnectOK, // 拡張されたハンドラーを使用
      ...chatHandlers,
      ...docHandlers,
      ...lockHandlers,
      ...roomHandlers,
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
