import React, { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

import useChatStore from './store/chatStore';
import useSocket from './store/useSocket';
import useSizeStore from './store/sizeStore';

const InputForm = ({ name }) => {
  const [message, setMessage] = useState('');
  const addMessage = useChatStore((state) => state.addMessage); // セレクタ関数を渡す
  const emitChatMessage = useSocket((state) => state.emitChatMessage); // useSocketからemitChatMessageを取得

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      addMessage(name, message); // chatStore.jsに追加
      emitChatMessage(message); // emitChatMessage関数を呼び出す
      setMessage(''); // 送信後、入力フィールドをクリア
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e);
  };

  const textBoxWidth = useSizeStore((state) => state.width) * 0.8; // 80%の幅を使用

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ margin: '24px 8%', width: textBoxWidth, alignItems: 'center' }}
    >
      <TextField
        label="Message"
        variant="standard"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown} // Ctrl + Enter で送信
      />
      <Tooltip title="Ctrl + Enter" placement='top' arrow>
        <span>
          <Button
            variant="contained"
            onClick={handleSubmit}
            endIcon={<SendIcon />}
            disabled={message.trim() === ''} // 空または空白スペースのみの場合は無効化
          >
            Send
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
};

export default InputForm;