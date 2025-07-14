// File: my-react-app/src/InputForm.jsx

import React, { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem'; // MenuItemをインポート

import useSizeStore from './store/sizeStore';

const InputForm = ({ nickname = '', status = '', ageGroup = '', userId = '', appController }) => {
  const [message, setMessage] = useState('');
  
  // --- ハンドルネーム選択用のstateを追加 ---
  const [handleName, setHandleName] = useState(nickname);
  
  // ✅ 修正: appControllerからsendChatMessage関数を取得
  const { chat: { send: sendChatMessage } } = appController;
  
  // --- 年代＋ステータスの組み合わせを生成 ---
  const ageLabel = ageGroup ? ageGroup.replace('s', '代') : '';
  const altHandle = ageLabel + (status || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // ❌ 問題: trim()だけでは不十分なバリデーションです
    // ✅ 修正案: 文字数制限やHTMLタグの除去など、より厳密なバリデーションを追加
    if (message.trim()) {
      // TODO: XSS対策やメッセージ長制限を追加
      // const sanitizedMessage = message.trim().slice(0, 1000); // 1000文字制限
      sendChatMessage(handleName, message); // ✅ 修正: appControllerのsendChatMessage使用
      setMessage(''); // 送信後、入力フィールドをクリア
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendChatMessage(handleName, message);
      setMessage('');
    }
  };

  const textBoxWidth = useSizeStore((state) => state.width) * 0.8; // 80%の幅を使用

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ margin: '24px 8%', width: textBoxWidth, alignItems: 'center' }}
    >
      {/* --- ハンドルネーム選択セレクトボックスを追加 --- */}
      <TextField
        select
        label="ハンドルネーム"
        value={handleName}
        onChange={e => setHandleName(e.target.value)}
        variant="standard"
        sx={{ width: 200 }}
      >
        <MenuItem value={nickname}>{nickname}</MenuItem>
        <MenuItem value={altHandle}>{altHandle}</MenuItem>
      </TextField>
      {/* --- メッセージ入力欄 --- */}
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