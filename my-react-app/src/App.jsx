import { useState, useEffect, use } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';

import { socket, setLoginName } from './SocketFunctions';

function App() {

  // login & name ////////////////////////////////////////////////////////////////////

  const [isName, setIsName] = useState(undefined);

  useEffect(() => { // useEffectはuseStateが変更時に実行

    console.log('isName', isName); // デバッグ用

    setLoginName(isName); // サーバーにログイン名を送信

  }, [isName]); // isName が変更するたびに表示される

  socket.on('connect', (userInfo) => {
    console.log('Connected to server', userInfo); // デバッグ用
  });

  // height & telomere ////////////////////////////////////////////////////////////////////

  const INITIAL_HEIGHT = 300; // 初期値
  const [heightArray, setHeightArray] = useState([INITIAL_HEIGHT]); // 初期値を含む配列

  socket.on('heightChange', (heightArray) => {
    console.log(' ON heightChange', heightArray);

    setHeightArray([...heightArray, heightArray[heightArray.length - 1]]); // 最新の高さを追加

    console.log('heightArray', heightArray); // デバッグ用
  });

  function handleHeightChange(newTopHeight) {
    setHeightArray([...heightArray, newTopHeight]); // 新しい高さを追加
    socket.emit("heightChange", newTopHeight); // サーバーに新しい高さを送信
    console.log("Top Height (after emit):", newTopHeight); // デバッグ用
  }

  const topHeight = heightArray[heightArray.length - 1]; // 最新の高さを取得

  ///////////////////////////////////////////////////////////////////////

  return (
    <>
      <BeforeLogin onLogin={setIsName} />
      <AfterLogin
        heightArray={heightArray}
        topHeight={topHeight}
        setTopHeight={handleHeightChange}
        isName={isName}
        onLogout={setIsName}
      />
    </>

  )
}

export default App
