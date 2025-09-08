// File: client/src/InputForm.jsx

import { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';

import useSizeStore from './store/sizeStore';
import useRoomStore from './store/roomStore';

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
      console.log(`📝 [InputForm] メッセージ送信開始 ルーム: ${activeRoomId} (${currentRoom?.name})`);
      console.log(`[InputForm] 送信者: ${handleName}, メッセージ: "${message}"`);

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
      sendChatMessage(handleName, message, activeRoomId);
      setMessage('');
    }
  };

  const textBoxWidth = useSizeStore((state) => state.width);

  return (
    <div id="InputFormBorder"
      style={{
        padding: '24px 8%', width: textBoxWidth, position: 'absolute', bottom: '1.5rem',
        backgroundColor: 'white', padding: '8px', border: '1.5px solid lightgray', borderRadius: '8px',
      }}
    >
      <Stack
        id="input-form"
        direction="row"
        spacing={2}
        sx={{ padding: '0.5rem', alignItems: 'center' }}
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
          label="チャットで送信（Ctrl+Enterで送信）"
          variant="standard"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown} // Ctrl + Enter で送信
        />
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
      </Stack>
    </div>
  );
};

export default InputForm;