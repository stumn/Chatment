import { useState, useEffect, Suspense, lazy, use } from 'react';

import useSocket from './store/useSocket';
import useChatStore from './store/chatStore';

import useResponsiveSize from './useResponsiveSize';
import useSizeStore from './store/sizeStore';

const BeforeLogin = lazy(() => import('./BeforeLogin'));
const AfterLogin = lazy(() => import('./AfterLogin'));

function App() {
  useResponsiveSize(); // レスポンシブサイズのフックを呼び出す
  const { width, height } = useSizeStore(); // サイズストアからwidthとheightを取得

  const {
    emitLoginName,
    emitHeightChange,
    emitChatMessage,
    emitFav,
    heightArray, // ← socket を意識せず取得
  } = useSocket();

  const addMessage = useChatStore((state) => state.addMessage); // セレクタ関数を渡す

  // login & name //////////////////////////////////////////

  const [isName, setIsName] = useState(undefined);
  const [connected, setConnected] = useState(false);

  useEffect(() => {

    if (isName === undefined) return; // isNameがundefinedの場合は何もしない
    emitLoginName(isName); // サーバーにログイン名を送信

  }, [isName]);

  // height & telomere /////////////////////////////////////

  // 1. 各ユーザーの高さを記憶するuseState
  const [myHeight, setMyHeight] = useState(300);

  // 1 -> server 各ユーザの高さが変更されたら、サーバーに送信
  useEffect(() => {
    emitHeightChange(myHeight); // サーバーに高さを送信
  }, [myHeight]); // myHeightが変更されたら実行

  ////////////////////////////////////////////////////////////

  // if (connected && isName) {
  if (isName) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <AfterLogin
            myHeight={myHeight}
            setMyHeight={setMyHeight}
            heightArray={heightArray}
            isName={isName}
            onLogout={setIsName}
            emitChatMessage={emitChatMessage}
          />

        </Suspense>
      </div>
    )
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <BeforeLogin onLogin={setIsName} />
        </Suspense>
      </div>
    );
  }

}

export default App;
