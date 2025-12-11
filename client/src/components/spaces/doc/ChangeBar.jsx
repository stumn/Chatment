// File: client/src/components/ChangeBar.jsx

import React from 'react';
import Tooltip from '@mui/material/Tooltip';

/**
 * 変更状態を表示するバーコンポーネント
 * @param {Object} props - プロパティ
 * @param {Object} props.changeState - 変更状態オブジェクト
 * @param {boolean} props.isFadingOut - フェードアウト中かどうか
 * @param {Function} props.onMouseEnter - マウスエンター時のハンドラー
 * @param {Function} props.onMouseLeave - マウスリーブ時のハンドラー
 */
const ChangeBar = ({
    changeState,
    isFadingOut,
    onMouseEnter,
    onMouseLeave
}) => {
    /**
     * 変更バーのTailwindクラスを決定する関数
     * @returns {string} Tailwindクラス名
     */
    const getChangeBarClasses = () => {
        const baseClasses = 'w-3 h-full min-h-5 mx-1 rounded-sm transition-all duration-200 cursor-pointer hover:shadow-md';
        
        if (!changeState) return `${baseClasses} bg-transparent`;

        switch (changeState.type) {
            case 'added':
                return `${baseClasses} bg-blue-500`; // 青 - 空行追加
            case 'modified':
                return `${baseClasses} bg-green-500`; // 緑 - 編集
            case 'deleted':
                return `${baseClasses} bg-red-500`; // 赤 - 削除
            case 'reordered':
                return `${baseClasses} bg-orange-500`; // オレンジ - 並び替え
            default:
                return `${baseClasses} bg-transparent`;
        }
    };

    /**
     * 変更タイプの日本語表示を取得する関数
     * @returns {string} 変更タイプの日本語名
     */
    const getChangeTypeLabel = () => {
        if (!changeState) return '';

        const typeLabels = {
            added: '空行追加',
            modified: '内容編集',
            deleted: '削除',
            reordered: '順序変更'
        };

        return typeLabels[changeState.type] || '';
    };

    /**
     * Tooltipの内容を生成する関数
     * @returns {JSX.Element} Tooltipの内容
     */
    const getTooltipContent = () => {
        if (!changeState) {
            return 'この行には、最近の編集履歴がありません';
        }

        return (
            <>
                【{getChangeTypeLabel()}】<br />
                実行者: {changeState.userNickname}<br />
                時刻: {changeState.timestamp.toLocaleString()}
            </>
        );
    };

    return (
        <Tooltip
            title={getTooltipContent()}
            arrow
            placement="left"
            enterDelay={300}
            leaveDelay={100}
            componentsProps={{
                tooltip: {
                    sx: { 
                        whiteSpace: 'pre-line', 
                        fontSize: '0.85em' 
                    }
                }
            }}
        >
            <div
                className={`${getChangeBarClasses()}${isFadingOut ? ' opacity-0 transition-opacity duration-[2000ms] ease-out' : ' opacity-100'} hover:!opacity-100`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            />
        </Tooltip>
    );
};

export default ChangeBar;
