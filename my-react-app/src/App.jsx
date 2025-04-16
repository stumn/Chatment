import { useState, useEffect } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';
import { io } from 'socket.io-client';

function App() {
  const [isName, setIsName] = useState(undefined);
  console.log('isName', isName);

  const socket = io(); // Socket.IOの初期化
  socket.on('heightChange', (heightArray) => {
    console.log('heightChange', heightArray);
  });

  return (
    isName === undefined
      ? <BeforeLogin onLogin={setIsName} />
      : <AfterLogin isName={isName} onLogout={setIsName} />
  )
}
export default App
