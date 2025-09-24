// File: client/src/ChatApp.jsx

import { useEffect, Suspense, lazy, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAppController } from '../../hooks/useAppController';

import useAppStore from '../../store/appStore';
import useSizeStore from '../../store/sizeStore';
import useSocket from '../../hooks/useSocket';

import useResponsiveSize from '../../utils/useResponsiveSize';

import BeforeLogin from "./BeforeLogin";
const AfterLogin = lazy(() => import('./AfterLogin'));

const DEFAULT_ROOM_ID = 'room-0';

function ChatApp() {
  // URLパラメータからspaceIdを取得
  const { spaceId } = useParams();
  
  // TODO: 将来的にspaceIdの妥当性チェックを実装
  // TODO: サーバーでスペースの存在確認とアクセス権限チェック  
  // TODO: スペース情報（タイトル、説明等）をAPIから取得
  // TODO: サーバー側でspaceId別のメッセージ分離とデータ管理
  // TODO: スペース参加者の管理とリアルタイム更新
  
  // --- 状態管理フックを先に記述 ---
  const [open, setOpen] = useState(true);

  // --- カスタムフック ---
  useResponsiveSize();

  // ストアからの状態取得
  const { width, height } = useSizeStore();
  const { userInfo, setUserInfo, myHeight, setMyHeight } = useAppStore();

  // useAppControllerを使用してSocket通信を一元管理
  const appController = useAppController();
  const { socket: { heightArray }, raw: socketFunctions } = appController;

  // ルーム関連のソケット関数を取得
  const { emitGetRoomList, emitJoinRoom } = useSocket();

  // ログイン状態を判定する変数を定義
  const isLoggedIn = userInfo.nickname !== undefined;

  useEffect(() => {
    if (!isLoggedIn) return;
    
    // TODO: spaceIdをソケット通信に含めてスペースコンテキストを送信
    socketFunctions.emitLoginName(userInfo);

    // TODO: スペース固有のルーム一覧を取得する機能を実装
    // ログイン後にルーム一覧を取得し、デフォルトルームに参加
    emitGetRoomList();
    
    // TODO: room-0ではなくスペース固有のデフォルトルームに参加
    emitJoinRoom(DEFAULT_ROOM_ID); // デフォルトルームに参加

    setOpen(false);
  }, [userInfo, isLoggedIn, spaceId]); // spaceIdを依存配列に追加

  // myHeightが変更されたらサーバーに高さを送信
  useEffect(() => {
    socketFunctions.emitHeightChange(myHeight);
  }, [myHeight]);

  if (isLoggedIn) { // ログイン完了後
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AfterLogin
          heightArray={heightArray}
          appController={appController}
          userInfo={userInfo}
          spaceId={spaceId}
        />
      </Suspense>
    );
  } else { // ログイン前
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <BeforeLogin open={open} onLogin={setUserInfo} />
      </Suspense>
    );
  }
}

export default ChatApp;