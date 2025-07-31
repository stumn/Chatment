// File: my-react-app/src/InputForm.jsx

import React, { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem'; // MenuItemをインポート

import useSizeStore from './store/sizeStore';
import useRoomStore from './store/roomStore';
import useSocket from './hooks/useSocket';

const InputForm = ({ nickname = '', status = '', ageGroup = '', userId = '', appController }) => {
  const [message, setMessage] = useState('');

  // --- ハンドルネーム選択用のstateを追加 ---
  const [handleName, setHandleName] = useState(nickname);

  // ルーム情報を取得
  const { activeRoomId, rooms } = useRoomStore();
  const currentRoom = rooms.find(room => room.id === activeRoomId);

  const { chat: { send: sendChatMessage } } = appController;

  // --- 年代＋ステータスの組み合わせを生成 ---
  const ageLabel = ageGroup ? ageGroup.replace('s', '代') : '';
  const altHandle = ageLabel + (status || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // ❌ 問題: trim()だけでは不十分なバリデーションです
    // ✅ 修正案: 文字数制限やHTMLタグの除去など、より厳密なバリデーションを追加
    if (message.trim()) {
      console.log(`📝 [InputForm] メッセージ送信開始`);
      console.log(`🏠 [InputForm] 選択中のルーム: ${activeRoomId} (${currentRoom?.name})`);
      console.log(`👤 [InputForm] 送信者: ${handleName}`);
      console.log(`💬 [InputForm] メッセージ: "${message}"`);

      // TODO: XSS対策やメッセージ長制限を追加
      // const sanitizedMessage = message.trim().slice(0, 1000); // 1000文字制限
      sendChatMessage(handleName, message, activeRoomId);

      // 送信後、入力フィールドをクリア
      setMessage('');
      console.log(`✅ [InputForm] メッセージ送信完了`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      console.log(`⌨️ [InputForm] Ctrl+Enter検出 - 送信開始`);

      sendChatMessage(handleName, message, activeRoomId);

      setMessage('');
      console.log(`✅ [InputForm] Ctrl+Enter送信完了`);
    }
  };

  const textBoxWidth = useSizeStore((state) => state.width) * 0.8; // 80%の幅を使用

  return (
    <Stack
      id="input-form"
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