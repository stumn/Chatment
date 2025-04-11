import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';

const InputForm = ({ isLoggedin, onLogin, onSendMessage }) => {
    const isLoggedIn = isLoggedin;  // propsからisLoggedInを取得
    const [message, setMessage] = useState("");

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim() === "") return;  // 空のメッセージは送信しない

        if (isLoggedIn) {
            // socket.emit('chat message', text);
            onSendMessage(message);  // 親コンポーネントにメッセージを送信
        } else {
            // socket.emit('login', text);
            onLogin(message);  // 親コンポーネントに名前を送信
        }
        setMessage("");  // 送信後、入力フィールドをクリア
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSendMessage(e);
        }
    };

    return (
        <Stack
            direction="row"
            spacing={2}
            sx={{ margin: '8px 8%', alignItems: 'center' }}
        >
            <TextField
                label={isLoggedIn ? "Message" : "Name"}
                variant="standard"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown} // Ctrl + Enter で送信
            />
            <Button
                variant="contained"
                onClick={handleSendMessage}
                endIcon={<SendIcon />}
                disabled={message.trim() === ""} // 空または空白スペースのみの場合は無効化
            >
                {isLoggedIn ? "Send" : "Login"}
            </Button>
        </Stack>
    );
};

export default InputForm;