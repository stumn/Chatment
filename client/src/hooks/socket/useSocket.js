// src/hooks/useSocket.js (新しい統合版)

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// ハンドラーのインポート
import { useBasicHandlers } from './socket/handlers/useBasicHandlers';
import { useChatHandlers } from './socket/handlers/useChatHandlers';
import { useDocHandlers } from './socket/handlers/useDocHandlers';
import { useLockHandlers } from './socket/handlers/useLockHandlers';
import { useRoomHandlers } from './socket/handlers/useRoomHandlers';

// エミッターのインポート
import { useBasicEmitters } from './socket/emitters/useBasicEmitters';
import { useChatEmitters } from './socket/emitters/useChatEmitters';
import { useDocEmitters } from './socket/emitters/useDocEmitters';
import { useRoomEmitters } from './socket/emitters/useRoomEmitters';

// ユーティリティのインポート
import { createEmitLog } from './socket/utils/socketUtils';
import { createEventHandlerMap } from './socket/utils/eventMap';

// ❌ 問題: socketインスタンスがモジュールスコープで作成されているため、
// アプリが再マウントされてもsocket接続が残り、メモリリークの原因になる可能性があります
// ✅ 修正案: useEffect内でsocket接続を管理し、クリーンアップで切断する
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

    // すべてのハンドラーをマージ
    const allHandlers = {
      ...basicHandlers,
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

    // useEffectの依存配列は空にして、初回マウント時のみ実行
    // 万一useSocketが複数回呼ばれても、リスナーが多重登録されないため。
  }, []);

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
