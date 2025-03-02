import './App.css'
import { useState, useEffect } from 'react'
import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'

function App() {
  const [messages, setMessages] = useState(['test 1', 'test 2', 'test 3', 'test 4']);
  const [lines, setLines] = useState(3);
  const chatMessages = lines === 0 ? [] : messages.slice(-lines);
  console.log(chatMessages);

  const [docMessages, setDocMessages] = useState([]);
  useEffect(() => {
    setDocMessages(messages.slice(0, Math.max(0, messages.length - lines)));
  }, [messages, lines]);

  const handleSendMessage = (message) => {
    setMessages([...messages, message]);
  };

  return (
    <div>
      <ResizablePanels chatMessages={chatMessages} docMessages={docMessages} onChangeDoc={setDocMessages} onMouseDragging={setLines} />
      <InputForm onSendMessage={handleSendMessage} />
    </div>
  )
}

export default App
