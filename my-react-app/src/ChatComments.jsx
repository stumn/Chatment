import React from 'react';
import { useState, useEffect } from 'react';
import useChatStore from './store/chatStore';

const ChatComments = ({ lines }) => {
    const MALTIPILER = 1.1; // フォントサイズの倍率
    const FONT_SIZE = 16; // 基本フォントサイズ

    const messages = useChatStore((state) => state.messages);
    const [chatMessages, setChatMessages] = useState([]);
    
    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const recentMessages =
            lines.num < 1.5
                ? [messages[messages.length - 1]] // ← 配列にしておく
                : messages.slice(-Math.ceil(lines.num)); // ← 小数対応

        setChatMessages(recentMessages);

        console.log('Chat Messages:', recentMessages);
        console.log('Lines:', lines);
    }, [lines]);


    return (
        <ul className="chat-window">
            {chatMessages.map((cMsg) => (
                <div
                    key={cMsg.order}
                    id={cMsg.id}
                    className="chat-cMsg"
                >
                    <span
                        style={{
                            fontSize: `${FONT_SIZE + cMsg.fav * MALTIPILER}px`,
                            marginLeft: '10px',
                            cursor: 'text',
                            border: 'none',
                            background: 'none',
                        }}
                    >
                        <strong>{cMsg.name}</strong> [{cMsg.time}]
                    </span>
                    <br />
                    <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        style={{
                            fontSize: `${FONT_SIZE + cMsg.fav * MALTIPILER}px`,
                            marginLeft: '10px',
                            cursor: 'text',
                            border: 'none',
                            background: 'none',
                        }}
                    >
                        {cMsg.msg}
                    </span>

                    <button
                        onClick={() => onFavClick(index)}
                        contentEditable={false}
                        style={{
                            fontSize: `${FONT_SIZE + cMsg.fav * MALTIPILER}px`,
                            marginLeft: '10px',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            color: cMsg.fav ? 'gold' : 'gray',
                        }}
                    >
                        ★
                    </button>
                </div>
            ))}
        </ul>

    );
};

export default ChatComments;