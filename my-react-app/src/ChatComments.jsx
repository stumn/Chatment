import React from 'react';

const ChatComments = ({ chatMessages = [], onFavClick }) => {
    return (
        <ul className="chat-window">
            {chatMessages.map((message, index) => (
                <li
                    key={index}
                    className="chat-message"
                    style={{
                        listStyleType: 'none',
                    }}
                >
                    <span
                        contentEditable={true}
                        style={{
                            fontSize: `${16 + message.fav * 2}px`,
                            marginLeft: '10px',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                        }}
                    >
                        <strong>{message.name}</strong> [{message.time}]- {message.message}
                    </span>

                    <button
                        onClick={() => onFavClick(index)}
                        contentEditable={false}
                        style={{
                            fontSize: `${16 + message.fav * 2}px`,
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