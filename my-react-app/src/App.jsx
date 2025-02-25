import './App.css'
import { useState } from 'react'
import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'

function App() {
  const [messages, setMessages] = useState([]);
  
  const handleSendMessage = (message) => {
    setMessages([...messages, message]);
  };

  return (
    <div>
      <ResizablePanels messages={messages}/>
      <InputForm onSendMessage={handleSendMessage}/>
    </div>
  )
}

export default App
