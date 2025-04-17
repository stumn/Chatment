import { useState, useEffect, use } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';
import { io } from 'socket.io-client';
const socket = io(); // Socket.IOの初期化

function App() {
  const [isName, setIsName] = useState(undefined);
  // console.log('isName', isName); // useState が変更するたびに表示される
  useEffect(() => {
    console.log('isName changed:', isName); // useState が変更するたびに表示される
  }, [isName]); // isName が変更するたびに表示される


  socket.on('connect', () => {
    console.log('Connected to server');
  });

  // 本番用 heightArray arary
  const [heightArray, setHeightArray] = useState([]);
  socket.on('heightChange', (heightArray) => {
    console.log(' ON heightChange', heightArray);
    setHeightArray([...heightArray, heightArray[heightArray.length - 1]]); // 最新の高さを追加
    console.log('heightArray', heightArray); // デバッグ用
  });

  const [topHeight, setTopHeight] = useState(460); // 初期値を460に設定
  function handleHeightChange(newTopHeight) {
    setTopHeight(newTopHeight);
    console.log("Top Height (App):", newTopHeight); // デバッグ用
    
    socket.emit("heightChange", newTopHeight); // サーバーに新しい高さを送信

    console.log("Top Height (after emit):", newTopHeight); // デバッグ用
  }

  return (
    isName === undefined
      ? <BeforeLogin onLogin={setIsName} />
      : <AfterLogin
        heightArray={heightArray}
        topHeight={topHeight}
        setTopHeight={handleHeightChange}
        isName={isName}
        onLogout={setIsName}
      />
  )
}
export default App
