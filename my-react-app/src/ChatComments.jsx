import React from 'react';

const ChatComments = ({ chatMessages = [] }) => {
    return (
        <ul className="chat-window">
            {chatMessages.map((message, index) => (
                <li
                    key={index}
                    className="chat-message"
                    contentEditable={true}
                >
                    {message}
                </li>
            ))}
        </ul>
    );
};

export default ChatComments;