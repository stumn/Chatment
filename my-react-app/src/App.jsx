// File: my-react-app/src/App.jsx

import { useEffect, Suspense, lazy, useState } from 'react';

import useSocket from './store/useSocket';
import useChatStore from './store/chatStore';
import useAppStore from './store/appStore';
import useSizeStore from './store/sizeStore';
import useResponsiveSize from './useResponsiveSize';

const BeforeLogin = lazy(() => import('./BeforeLogin'));
const AfterLogin = lazy(() => import('./AfterLogin'));

function App() {
  useResponsiveSize(); // レスポンシブサイズのフックを呼び出す
  const { width, height } = useSizeStore(); // サイズストアからwidthとheightを取得

  // --- open状態をuseStateで管理（BeforeLoginのopen propエラー防止） ---
  const [open, setOpen] = useState(true); // ログインダイアログの表示状態

  const {
    emitLoginName,
    emitHeightChange,
    emitChatMessage,
    emitFav,
    heightArray, // ← socket を意識せず取得
  } = useSocket(); // useSocketはApp全体で1回だけ呼び出す。不要な呼び出しがないか確認済み。

  // login & name //////////////////////////////////////////

  const { userInfo, setUserInfo, myHeight, setMyHeight } = useAppStore(); // useAppStoreからuserInfoとsetUserInfoを取得

  useEffect(() => {

    if (userInfo.nickname === undefined) return; // userInfoがundefinedの場合は何もしない
    emitLoginName(userInfo); // サーバーにログイン名を送信
    setOpen(false); // ログイン後にダイアログを閉じる

  }, [userInfo]);

  // height & telomere /////////////////////////////////////

  // 1. 各ユーザーの高さを記憶するuseState

  // 1 -> server 各ユーザの高さが変更されたら、サーバーに送信
  useEffect(() => {
    emitHeightChange(myHeight); // サーバーに高さを送信
  }, [myHeight]); // myHeightが変更されたら実行

  ////////////////////////////////////////////////////////////

  // if (connected && userInfo) {
  if (userInfo.nickname !== undefined) { // userInfoがundefinedでない場合に表示
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          {/* emitFavをAfterLoginに渡す */}
          <AfterLogin
            heightArray={heightArray}
            emitChatMessage={emitChatMessage}
            emitFav={emitFav}
          />
        </Suspense>
      </div>
    )
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          {/* open propを明示的に渡す。onLoginでsetUserInfoを渡す。*/}
          <BeforeLogin open={open} onLogin={setUserInfo} />
        </Suspense>
      </div>
    );
  }

}

export default App;
