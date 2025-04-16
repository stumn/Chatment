import './App.css'
import { useState, useEffect } from 'react'
import BeforeLogin from './BeforeLogin';
import AfterLogin from './AfterLogin';

function App() {
  const [isName, setIsName] = useState(undefined);
  console.log('isName', isName);

  return (
    isName === undefined
      ? <BeforeLogin onLogin={setIsName} />
      : <AfterLogin isName={isName} onLogout={setIsName} />
  )

}
export default App
