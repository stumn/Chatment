import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';
import useChatStore from './store/chatStore';

const InputForm = () => {
  const [message, setMessage] = useState('');
  const addMessage = useChatStore((state) => state.addMessage); // セレクタ関数を渡す

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Sending message:', message); // デバッグ用
      addMessage({ text: message, time: new Date().toLocaleTimeString() }); // オブジェクト形式で追加
      setMessage(''); // 送信後、入力フィールドをクリア
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e);
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ margin: '8px 8%', alignItems: 'center' }}
    >
      <TextField
        label="Message"
        variant="standard"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown} // Ctrl + Enter で送信
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        endIcon={<SendIcon />}
        disabled={message.trim() === ''} // 空または空白スペースのみの場合は無効化
      >
        Send
      </Button>
    </Stack>
  );
};

export default InputForm;