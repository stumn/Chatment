import { useState, useEffect, use } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';

import { socket, emitLoginName, emitHeightChange } from './SocketFunctions';
import { set } from 'mongoose';

function App() {

  // login & name ////////////////////////////////////////////////////////////////////

  const [isName, setIsName] = useState(undefined);

  useEffect(() => { // useEffectはuseStateが変更時に実行

    if (isName === undefined) return; // isNameがundefinedの場合は何もしない
    emitLoginName(isName); // サーバーにログイン名を送信

  }, [isName]);

  // height & telomere ////////////////////////////////////////////////////////////////////

  // 1. 各ユーザーの高さを記憶するuseState
  const [myHeight, setMyHeight] = useState(300);

  // 1 -> server 各ユーザの高さが変更されたら、サーバーに送信
  useEffect(() => {
    console.log('myHeight', myHeight); // デバッグ用
    emitHeightChange(myHeight); // サーバーに高さを送信
  }, [myHeight]); // myHeightが変更されたら実行
  
  // 2. ユーザ全体の高さを記憶するuseState（配列 socket.id + height) 
  const [heightArray, setHeightArray] = useState  ([]);

  // server -> 2 サーバーから受信したら高さを配列に追加
  socket.on('heightChange', (heightArray) => {
    console.log(' ON heightChange', heightArray); // デバッグ用

    // heightArrayは受信したデータをそのまま配列に追加する
    setHeightArray(heightArray); // 受信した高さを配列に追加
  });

  ///////////////////////////////////////////////////////////////////////

  return (
    <>
      <BeforeLogin onLogin={setIsName} />
      <AfterLogin
        myHeight={myHeight}
        setMyHeight={setMyHeight}
        heightArray={heightArray}
        isName={isName}
        onLogout={setIsName}
      />
    </>

  )
}

export default App
