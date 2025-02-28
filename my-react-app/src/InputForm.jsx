import React, { useState } from 'react';

const InputForm = ({ onSendMessage }) => {
    const [message, setMessage] = useState([]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);  // 親コンポーネントにメッセージを送信
            setMessage("");  // 送信後、入力フィールドをクリア
        }
    };

    return (
        <div>
            <form>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message"
                />
                <button onClick={handleSendMessage}>Send</button>
            </form>
        </div>
    );

};

export default InputForm;