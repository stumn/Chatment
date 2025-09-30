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
        <div className="flex flex-col px-6 pt-6 pb-0 flex-shrink-0 bg-gray-100 border-b border-gray-200">
            <button 
                onClick={onToggle} 
                className="self-start p-0 rounded-full bg-transparent border-none cursor-pointer text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 h-auto mb-4"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* ユーザー情報と現在のステータス */}
            <div className="flex flex-col items-start gap-2 mb-4 sidebar-text">
                {/* スペースID表示 */}
                {spaceId && (
                    <div className="text-xs text-gray-600 font-bold mb-1">
                        Space: {spaceId}
                    </div>
                )}
                <span className="text-lg text-gray-800">
                    {userInfo?.nickname ? `${userInfo.nickname} (${userInfo.ageGroup} ${userInfo.status})さん` : 'ゲスト'}
                </span>
                <div className="flex items-center text-sm text-gray-600">
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
                                    color: '#6b7280'
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