// File: client/src/InputForm.jsx

import { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { Stack, Alert } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';

import useSizeStore from '../../../store/sizeStore';
import useRoomStore from '../../../store/spaces/roomStore';

const InputForm = ({ nickname = '', status = '', ageGroup = '', userId = '', appController }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    setError(''); // エラーをクリア

    // activeRoomIdがnullの場合はエラーを表示
    if (!activeRoomId && !rooms[0]) {
      setError('ルームに参加していません。しばらくお待ちください。');
      // return;
    }

    // バリデーション付きでメッセージ送信
    const result = sendChatMessage(handleName, message, activeRoomId);

    result.success
      ? setMessage('')
      : setError(result.error);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  const textBoxWidth = useSizeStore((state) => state.width);

  return (
    <div id="InputFormBorder"
      style={{
        width: textBoxWidth,
        position: 'absolute',
        bottom: '1.5rem',
        backgroundColor: 'white',
        padding: '8px',
        border: '1.5px solid lightgray',
        borderRadius: '8px',
      }}
    >
      {/* エラーメッセージの表示 */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 1, fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

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
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(''); // 入力中にエラーをクリア
          }}
          onKeyDown={handleKeyDown} // Ctrl + Enter で送信
          error={!!error} // エラー状態を表示
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