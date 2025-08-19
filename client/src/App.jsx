// File: client/src/App.jsx

import { useEffect, Suspense, lazy, useState } from 'react';

import { useAppController } from './hooks/useAppContoroller';

import useAppStore from './store/appStore';
import useSizeStore from './store/sizeStore';
import useSocket from './hooks/useSocket';

import useResponsiveSize from './useResponsiveSize';

import BeforeLogin from "./BeforeLogin";
const AfterLogin = lazy(() => import('./AfterLogin'));

const DEFAULT_ROOM_ID = 'room-0';

function App() {
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
    socketFunctions.emitLoginName(userInfo);
    
    // ログイン後にルーム一覧を取得し、デフォルトルームに参加
    emitGetRoomList();
    emitJoinRoom(DEFAULT_ROOM_ID); // デフォルトルームに参加

    setOpen(false);
  }, [userInfo, isLoggedIn]);

  // myHeightが変更されたらサーバーに高さを送信
  useEffect(() => {
    socketFunctions.emitHeightChange(myHeight);
  }, [myHeight]);


  if (isLoggedIn) { // ログイン完了後
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: width, height: height }}>
        <Suspense fallback={<div>Loading...</div>}>
          <AfterLogin
            heightArray={heightArray}
            appController={appController}
            userInfo={userInfo}
          />
        </Suspense>
      </div>
    );
  } else { // ログイン前
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <BeforeLogin open={open} onLogin={setUserInfo} />
        </Suspense>
      </div>
    );
  }

}

export default App;
