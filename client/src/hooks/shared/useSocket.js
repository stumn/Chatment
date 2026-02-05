// src/hooks/useSocket.js (新しい統合版)

import { useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

// ハンドラーのインポート
import { useBasicHandlers } from '../spaces/handlers/useBasicHandlers';
import { useChatHandlers } from '../spaces/handlers/useChatHandlers';
import { useDocHandlers } from '../spaces/handlers/useDocHandlers';
import { useLockHandlers } from '../spaces/handlers/useLockHandlers';

// エミッターのインポート
import { useBasicEmitters } from '../spaces/emitters/useBasicEmitters';
import { useChatEmitters } from '../spaces/emitters/useChatEmitters';
import { useDocEmitters } from '../spaces/emitters/useDocEmitters';

// ユーティリティのインポート
import { createEmitLog } from '../spaces/socketUtils/socketUtils';
import { createEventHandlerMap } from '../spaces/socketUtils/eventMap';

const socket = io();

// --- socketインスタンスを外部参照用にexport ---
export const socketId = () => socket.id;

export default function useSocket() {
  const [heightArray, setHeightArray] = useState([]);

  // イベントリスナー登録済みフラグ（重複登録防止）
  const isListenersRegisteredRef = useRef(false);

  // emitLog関数を作成（useMemoで安定化）
  const emitLog = useMemo(() => createEmitLog(socket), []);

  // 各エミッターフックを呼び出し
  const basicEmitters = useBasicEmitters(socket, emitLog);
  const chatEmitters = useChatEmitters(socket, emitLog);
  const docEmitters = useDocEmitters(socket, emitLog);

  // 各ハンドラーフックを呼び出し
  const basicHandlers = useBasicHandlers(socket);
  const chatHandlers = useChatHandlers(emitLog);
  const docHandlers = useDocHandlers(emitLog);
  const lockHandlers = useLockHandlers(emitLog);

  // ハンドラーをrefで保持（最新の参照を維持しつつ、依存配列を安定化）
  const handlersRef = useRef({
    basicHandlers,
    chatHandlers,
    docHandlers,
    lockHandlers
  });

  // 毎レンダリングでrefを更新
  handlersRef.current = {
    basicHandlers,
    chatHandlers,
    docHandlers,
    lockHandlers
  };

  useEffect(() => {
    // 既に登録済みの場合はスキップ
    if (isListenersRegisteredRef.current) {
      return;
    }

    // heightChangeハンドラーは状態更新のため、ここで定義
    const handleHeightChange = (data) => setHeightArray(data);

    // 認証完了後の処理
    const enhancedHandleConnectOK = (userInfo) => {
      // 最新のハンドラーを参照
      const { basicHandlers: currentBasicHandlers } = handlersRef.current;

      // 既存の処理を実行
      currentBasicHandlers.handleConnectOK(userInfo);
    };

    // 各イベントハンドラーを動的に参照するラッパーを作成
    // これにより、イベント発火時に常に最新のハンドラーが使用される
    const dynamicHandlers = {
      handleConnectOK: enhancedHandleConnectOK,
      handleHeightChange,
      handleHistory: (...args) => handlersRef.current.basicHandlers.handleHistory(...args),
      handleDocsHistory: (...args) => handlersRef.current.basicHandlers.handleDocsHistory(...args),
      handleConnectError: (...args) => handlersRef.current.basicHandlers.handleConnectError(...args),
      handleDisconnect: (...args) => handlersRef.current.basicHandlers.handleDisconnect(...args),
      handleChatMessage: (...args) => handlersRef.current.chatHandlers.handleChatMessage(...args),
      handlePositive: (...args) => handlersRef.current.chatHandlers.handlePositive(...args),
      handleNegative: (...args) => handlersRef.current.chatHandlers.handleNegative(...args),
      handleDocAdd: (...args) => handlersRef.current.docHandlers.handleDocAdd(...args),
      handleDocEdit: (...args) => handlersRef.current.docHandlers.handleDocEdit(...args),
      handleDocReorder: (...args) => handlersRef.current.docHandlers.handleDocReorder(...args),
      handleDocDelete: (...args) => handlersRef.current.docHandlers.handleDocDelete(...args),
      handleDocError: (...args) => handlersRef.current.docHandlers.handleDocError(...args),
      handleIndentChange: (...args) => handlersRef.current.docHandlers.handleIndentChange(...args),
      handleLockPermitted: (...args) => handlersRef.current.lockHandlers.handleLockPermitted(...args),
      handleRowLocked: (...args) => handlersRef.current.lockHandlers.handleRowLocked(...args),
      handleRowUnlocked: (...args) => handlersRef.current.lockHandlers.handleRowUnlocked(...args),
      handleLockNotAllowed: (...args) => handlersRef.current.lockHandlers.handleLockNotAllowed(...args),
      // user-leftイベント用（スペース単位）
      handleUserLeft: (data) => {
        console.log('👋 ユーザーがスペースから退出:', data);
      },
    };

    // イベントハンドラーマップを作成
    const eventHandlers = createEventHandlerMap(dynamicHandlers);

    // ループでイベントリスナーを登録
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // 登録済みフラグを設定
    isListenersRegisteredRef.current = true;

    // クリーンアップ
    return () => {
      // ループでイベントリスナーを解除
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event);
      });
      isListenersRegisteredRef.current = false;
    };

  }, []); // 空の依存配列（初回マウント時のみ実行）

  return {
    // 基本
    ...basicEmitters,
    heightArray,
    socketId: socket.id,

    // chat関連のemit関数
    ...chatEmitters,

    // Doc系のemit関数
    ...docEmitters,

    // 任意の操作ログをサーバに送信
    emitLog,
  };
}
