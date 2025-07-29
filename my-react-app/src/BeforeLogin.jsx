// File: my-react-app/src/BeforeLogin.jsx

import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { createTheme, ThemeProvider } from '@mui/material/styles';
const defaultTheme = createTheme();

function BeforeLogin({ open, onLogin }) {
    // 各フォーム要素の状態を管理
    const [nickname, setNickname] = useState('');
    const [status, setStatus] = useState('');
    const [ageGroup, setAgeGroup] = useState('');

    // コンポーネントマウント時にローカルストレージから前回の入力値を読み込む
    useEffect(() => {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
            try {
                const { nickname, status, ageGroup } = JSON.parse(savedUserInfo);
                setNickname(nickname || '');
                setStatus(status || '');
                setAgeGroup(ageGroup || '');
            } catch (error) {
                console.error('ローカルストレージのデータ読み込みエラー:', error);
            }
        }
    }, []);

    // フォーム送信時のハンドラ
    const handleSubmit = (event) => {
        event.preventDefault();
        // 入力値が空でないか基本的なバリデーション
        if (!nickname || !status || !ageGroup) {
            alert('すべての項目を入力してください。');
            return;
        }

        // 次回以降、フォームに自動入力するためにlocalStorageに保存
        localStorage.setItem('userInfo', JSON.stringify({ nickname, status, ageGroup }));

        // 収集したデータを親コンポーネントに渡す
        onLogin({ nickname, status, ageGroup });
    };

    // 年代の選択肢
    const ageGroups = ['10s', '20s', '30s', '40s', '50s', 'over 60s'];

    return (
        <ThemeProvider theme={defaultTheme}>
            <Dialog
                open={open}
                // onCloseはApp側でopen制御するため不要。undefinedにしてエラー防止。
                onClose={undefined}
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmit,
                }}
            >

                <DialogTitle>ログイン</DialogTitle>

                <DialogContent>

                    {/* ニックネーム入力欄 */}
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="nickname"
                        name="nickname"
                        label="ニックネーム"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />

                    {/* 属性選択 */}
                    <FormControl fullWidth required margin="dense" variant="standard">
                        <InputLabel id="status-select-label">属性</InputLabel>
                        <Select
                            labelId="status-select-label"
                            id="status-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            label="属性"
                        >
                            <MenuItem value={'学部生'}>学部生</MenuItem>
                            <MenuItem value={'院生'}>院生</MenuItem>
                            <MenuItem value={'教員'}>教員</MenuItem>
                            <MenuItem value={'その他'}>その他</MenuItem>
                        </Select>
                    </FormControl>

                    {/* 年代選択 */}
                    <FormControl fullWidth required margin="dense" variant="standard">
                        <InputLabel id="age-group-select-label">年代</InputLabel>
                        <Select
                            labelId="age-group-select-label"
                            id="age-group-select"
                            value={ageGroup}
                            onChange={(e) => setAgeGroup(e.target.value)}
                            label="年代"
                        >
                            {ageGroups.map((age) => (
                                <MenuItem key={age} value={age}>{age}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </DialogContent>

                <DialogActions>
                    <Button type="submit">ログインする</Button>
                </DialogActions>

            </Dialog>
        </ThemeProvider>
    );
}

export default BeforeLogin;