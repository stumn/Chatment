// File: my-react-app/src/BeforeLogin.jsx

import React, { useState } from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function BeforeLogin({ onLogin }) {

    // ダイアログの状態を管理するためのステート
    const [open, setOpen] = useState(true); // 初期状態を true に変更
    const handleClose = () => { setOpen(false); };

    // 名前を管理するためのステート
    const [name, setName] = useState('');
    const handleNameChange = (event) => {
        setName(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onLogin(name); // 親コンポーネントに名前を送信
        setOpen(false); // ダイアログを閉じる
    }

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        component: 'form',
                        onSubmit: handleSubmit,
                    },
                }}
            >
                <DialogTitle>Log In</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        チャットに参加するためには、名前を入力してください。
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="name"
                        fullWidth
                        variant="standard"
                        value={name}
                        onChange={handleNameChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button type="submit">ログインする</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}