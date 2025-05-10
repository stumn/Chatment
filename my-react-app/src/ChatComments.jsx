import React from 'react';
import { FixedSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';

const ChatComments = () => {
    const MALTIPILER = 1.1; // フォントサイズの倍率
    const FONT_SIZE = 16; // 基本フォントサイズ

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);

    return (
        <ul className="chat-window">
            {messages.map((message) => (
                <li
                    key={message.order}
                    id={message.id}
                    className="chat-message"
                    style={{
                        listStyleType: 'none',
                    }}
                >
                    <span
                        contentEditable={true}
                        style={{
                            fontSize: `${FONT_SIZE + message.fav * MALTIPILER}px`,
                            marginLeft: '10px',
                            cursor: 'text',
                            border: 'none',
                            background: 'none',
                        }}
                    >
                        <strong>{message.name}</strong> [{message.time}]- {message.msg}
                    </span>

                    <button
                        onClick={() => onFavClick(index)}
                        contentEditable={false}
                        style={{
                            fontSize: `${FONT_SIZE + message.fav * MALTIPILER}px`,
                            marginLeft: '10px',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                        }}
                    >
                        ★
                    </button>
                </li>
            ))}
        </ul>

    );
};

export default ChatComments;