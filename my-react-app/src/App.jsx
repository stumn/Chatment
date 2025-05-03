import { useState, useEffect, use } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';
import { io } from 'socket.io-client';

const socket = io(); // Socket.IOの初期化

// const socket = io.connect('https://chatment.onrender.com', {
//     reconnect: true,                // 自動再接続を有効にする
//     reconnectionAttempts: Infinity, // 無限回再接続を試みる
//     reconnectionDelay: 1000,        // 再接続前の待機時間（ミリ秒）
//     reconnectionDelayMax: 5000,     // 最大待機時間（ミリ秒）
//     timeout: 10000,                 // 接続試行のタイムアウト時間（ミリ秒）
// });

function App() {
  const [isName, setIsName] = useState(undefined);

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

    // // debag用
    // console.log("Top Height (App):", newTopHeight);
    // setHeightArray([...heightArray, newTopHeight]); // 新しい高さを追加
    
    // 本番socket 用
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
