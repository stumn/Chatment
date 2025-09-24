// File: client/src/components/sidebar/SidebarHeader.jsx

import React from 'react';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

/**
 * サイドバーのヘッダー部分（上部固定領域）
 * @param {Object} props - プロパティ
 * @param {Function} props.onToggle - サイドバーを閉じる関数
 * @param {string} props.spaceId - 現在のスペースID
 * @param {Object} props.userInfo - ユーザー情報
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {Function} props.toggleColorfulMode - カラフルモード切り替え関数
 */
const SidebarHeader = ({ 
    onToggle, 
    spaceId, 
    userInfo, 
    isColorfulMode, 
    toggleColorfulMode 
}) => {
    return (
        <div className="sb-header">
            <button onClick={onToggle} className="sb-toggle-button open">
                <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* ユーザー情報と現在のステータス */}
            <div className="sb-user-info sidebar-text">
                {/* スペースID表示 */}
                {spaceId && (
                    <div className="sb-space-id" style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '4px',
                        fontWeight: 'bold'
                    }}>
                        Space: {spaceId}
                    </div>
                )}
                <span className="sb-user-name">
                    {userInfo?.nickname ? `${userInfo.nickname} (${userInfo.ageGroup} ${userInfo.status})さん` : 'ゲスト'}
                </span>
                <div className="sb-colorful-mode">
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isColorfulMode}
                                    onChange={toggleColorfulMode}
                                    size="small"
                                    color="primary"
                                />
                            }
                            label="カラフルモード"
                            labelPlacement="start"
                            sx={{
                                margin: 0,
                                '& .MuiFormControlLabel-label': {
                                    fontSize: '12px',
                                    color: '#666'
                                }
                            }}
                        />
                    </FormGroup>
                </div>
            </div>
        </div>
    );
};

export default SidebarHeader;