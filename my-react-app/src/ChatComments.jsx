import React from 'react';

const ChatComments = ({ messages }) => {
    return (
        <ul
            className="chat-window"
            style={{ overflow: 'auto' }}>
            {messages.map((message, index) => (
                <li key={index} className="chat-message">
                    {message}
                </li>
            ))}
        </ul>
    );
};

export default ChatComments;