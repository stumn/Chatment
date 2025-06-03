import { useState, useEffect, Suspense, lazy } from 'react';

import { io } from 'socket.io-client';
const socket = io(); // サーバーに接続するためのSocket.IOクライアントを作成

import useChatStore from './store/chatStore';

const BeforeLogin = lazy(() => import('./BeforeLogin'));
const AfterLogin = lazy(() => import('./AfterLogin'));

function App() {

  const addMessage = useChatStore((state) => state.addMessage); // セレクタ関数を渡す

  // login & name //////////////////////////////////////////

  const [isName, setIsName] = useState(undefined);
  const [connected, setConnected] = useState(false);

  useEffect(() => {

    if (isName === undefined) return; // isNameがundefinedの場合は何もしない
    emitLoginName(isName); // サーバーにログイン名を送信

  }, [isName]);

  function emitLoginName(name) {
    socket.emit('login', name); // サーバーにログイン名を送信
  }

  socket.on('connect OK', (userInfo) => {
    console.log('Connected to server', userInfo); // デバッグ用
    setConnected(true); // 接続成功時に状態を更新
    socket.emit('fetch-history'); // サーバーに過去の投稿を要求
  });

  socket.on('history', (historyArray) => {
    historyArray.forEach((history) => {
      addMessage(history.name, history.msg); // チャットストアにメッセージを追加
    });
  });

  function emitHeightChange(heightArray) {
    socket.emit('heightChange', heightArray); // サーバーに高さを送信
  }

  function emitChatMessage(msg) {
    socket.emit('chat-message', msg); // サーバーにチャットメッセージを送信
  }

  socket.on('chat-message', (msg) => {
    console.log('Chat message received:', msg); // デバッグ用
    // ここで受信したメッセージを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
  });

  function emitFav(id) {
    socket.emit('fav', id); // サーバーにお気に入りを送信
    console.log('Favorite emitted:', id); // デバッグ用
  }

  socket.on('fav', (post) => {
    console.log('Favorite received:', post); // デバッグ用
    // ここで受信したお気に入りを処理することができます
    // 必要になれば、App.jsxのstateに保存する
    // そのために、App.jsx に配置する
  });

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
