// File: client/src/InputForm.jsx

import { useState } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import PollIcon from '@mui/icons-material/Poll';
import { Stack, Alert, IconButton, Chip, Checkbox, FormControlLabel } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';

import useSizeStore from '../../../store/sizeStore';
import useRoomStore from '../../../store/spaces/roomStore';

const InputForm = ({ nickname = '', status = '', ageGroup = '', userId = '', appController }) => {

  // 状態管理
  const [handleName, setHandleName] = useState(nickname);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPollMode, setIsPollMode] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

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
      console.error('ルームに参加していません。しばらくお待ちください。');
    }

    // アンケートモードの場合
    if (isPollMode && message.includes('：')) {

      // 開発用コンソル出力
      console.log('アンケートモードでの送信:', isPollMode, message, '匿名:', isAnonymous);

      // アンケート形式の解析（：によって分割）
      const parts = message.split('：').map(p => p.trim());
      const question = parts[0];
      const options = parts.slice(1).filter(o => o !== '');

      console.log('アンケート質問:', question, '選択肢:', options);

      if (options.length < 2) {
        setError('アンケートには最低2つの選択肢が必要です');
        return;
      }

      // アンケートデータを含むメッセージとして送信
      const pollData = {
        question,
        options: options.map(label => ({ label, votes: [] })),
        isAnonymous
      };

      console.log('送信するアンケートデータ:', pollData);

      const result = sendChatMessage(handleName, '', activeRoomId, pollData);

      if (result.success) {
        setMessage('');
        setIsPollMode(false);
        setIsAnonymous(false);
      } else {
        setError(result.error);
      }
      return;
    }

    // 通常のメッセージ送信
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

  const togglePollMode = () => {
    if (!isPollMode) {
      setIsPollMode(true);
      if (!message) setMessage('質問：選択肢1：選択肢2');
    } else {
      setIsPollMode(false);
      setIsAnonymous(false);
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

      {/* アンケートモードインジケーター */}
      {isPollMode && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, p: 1, bgcolor: '#f0f7ff', borderRadius: 1 }}>
          <Chip
            icon={<PollIcon />}
            label="アンケート作成モード"
            size="small"
            color="primary"
            variant="outlined"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="匿名回答"
            sx={{ fontSize: '0.875rem' }}
          />
        </Stack>
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
          label={isPollMode ? "質問：選択肢1：選択肢2..." : "チャットで送信（Ctrl+Enterで送信）"}
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

        {/* アンケート作成モード トグルボタン */}
        <IconButton
          onClick={togglePollMode}
          color={isPollMode ? "primary" : "default"}
          title="アンケートを作成"
        >
          <PollIcon />
        </IconButton>

        {/* 送信ボタン */}
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