import { useState, useEffect } from 'react'
import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'

export default function AfterLogin({ isName, onLogout }) {

    // window が閉じられる等の場合に、isNameをundefinedにする

    const [messages, setMessages] = useState([
        { id: 1, order: 1, name : 'Alice', msg: 'Hello, how can I help you today?', time: '10:55:30', fav: 0 },
        { id: 2, order: 2, name : 'Bob', msg: 'I have a question about my order.', time: '10:56:00', fav: 0 },
        { id: 3, order: 3, name : 'Alice', msg: 'Sure! What is your order number?', time: '10:57:00', fav: 0 },
        { id: 4, order: 4, name : 'Bob', msg: 'It is #12345.', time: '10:58:00', fav: 0 },
        { id: 5, order: 5, name : 'Alice', msg: 'Thank you! I will check it for you.', time: '10:59:00', fav: 0 },
        { id: 6, order: 6, name : 'Bob', msg: 'Great! Thank you!', time: '11:00:00', fav: 0 },
    ]);

    const handleSendMessage = (message) => {
        const newMessageData = {
            id: messages.length + 1,
            order: messages.length + 1,
            name: isName,
            msg: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fav: 0,
        };
        setMessages([...messages, newMessageData]);
    };

    const handleUpdateFav = (index) => {
        const updatedMessages = [...messages];
        console.log(updatedMessages);
        console.log(updatedMessages[index]);
        if (!updatedMessages[index]) return;
        updatedMessages[index].fav += 1;
        setMessages(updatedMessages);
    };

    // /////////////////////////////////////////////////////////////////////////////////////////////
    const [lines, setLines] = useState(3);
    // const chatMessages = lines === 0 ? [] : messages.slice(-lines);

    const [docMessages, setDocMessages] = useState([]);
    useEffect(() => {
        setDocMessages(messages.slice(0, Math.max(0, messages.length - lines)));
    }, [messages, lines]);
    // /////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <div>
            <h6 style={{ fontSize: '20px', margin: '8px 0', textAlign: 'left' }}>
                {'Logged in as ' + isName}
            </h6>

            <ResizablePanels
                chatMessages={messages}
                docMessages={docMessages}
                onChangeDoc={setDocMessages}
                onChangeLines={setLines}
                onUpdateFav={handleUpdateFav}
            />

            <InputForm onSendMessage={handleSendMessage} />
        </div>
    );
}