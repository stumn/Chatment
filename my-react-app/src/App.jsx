import { useState, useEffect, Suspense, lazy } from 'react';
import { socket, emitLoginName, emitHeightChange } from './SocketFunctions';

const BeforeLogin = lazy(() => import('./BeforeLogin'));
const AfterLogin = lazy(() => import('./AfterLogin'));

function App() {

  // login & name //////////////////////////////////////////

  const [isName, setIsName] = useState(undefined);

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

  // 2. ユーザ全体の高さを記憶するuseState（配列 socket.id + height) 
  const [heightArray, setHeightArray] = useState([]);

  // server -> 2 サーバーから受信したら高さを配列に追加
  useEffect(() => {
    const handleHeightChange = (heightArray) => {
      setHeightArray(heightArray);
    };

    socket.on('heightChange', handleHeightChange);

    return () => {
      socket.off('heightChange', handleHeightChange); // クリーンアップ
    };
  }, []);

  ////////////////////////////////////////////////////////////

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '95vh' }}>
      <Suspense fallback={<div>Loading...</div>}>

        <BeforeLogin onLogin={setIsName} />

        <AfterLogin
          myHeight={myHeight}
          setMyHeight={setMyHeight}
          heightArray={heightArray}
          isName={isName}
          onLogout={setIsName}
        />

      </Suspense>
    </div>
  )
}

export default App;
