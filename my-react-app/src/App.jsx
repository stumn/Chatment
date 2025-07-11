// File: my-react-app/src/App.jsx

import { useEffect, Suspense, lazy, useState } from 'react';

import useSocket from './hooks/useSocket'; // useSocketはApp全体で1回だけ呼び出す。

import useAppStore from './store/appStore';
import useSizeStore from './store/sizeStore';

import useResponsiveSize from './useResponsiveSize';

import BeforeLogin from "./BeforeLogin";
const AfterLogin = lazy(() => import('./AfterLogin'));

function App() {
  // --- 状態管理フックを先に記述 ---
  const [open, setOpen] = useState(true);

  // --- カスタムフック ---
  useResponsiveSize();

  // --- ストアからの状態取得 ---
  const { width, height } = useSizeStore();
  const { userInfo, setUserInfo, myHeight, setMyHeight } = useAppStore();

  // --- useSocketを呼び出してsocket関数を取得 ---
  const socketFunctions = useSocket(); // useSocketの戻り値を直接利用
  const { heightArray, emitLoginName, emitHeightChange } = socketFunctions; // 個別に使いたいものだけを分割代入

  // ログイン状態を判定する変数を定義////////////////////////////////////
  const isLoggedIn = userInfo.nickname !== undefined;

  useEffect(() => {
    if (!isLoggedIn) return; // 判定変数を利用
    emitLoginName(userInfo);
    setOpen(false);
  }, [userInfo, isLoggedIn]); // isLoggedInも依存配列に追加

  // myHeightが変更されたらサーバーに高さを送信///////////////////////////
  useEffect(() => { emitHeightChange(myHeight); }, [myHeight]);


  if (isLoggedIn) { // ログイン完了後
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <AfterLogin
            heightArray={heightArray}
            socketFunctions={socketFunctions}
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
