// File: my-react-app/src/components/ChangeBar.jsx

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
     * 変更バーのスタイルクラスを決定する関数
     * @returns {string} CSSクラス名
     */
    const getChangeBarClass = () => {
        if (!changeState) return 'bar-none';

        switch (changeState.type) {
            case 'added':
                return 'bar-added';
            case 'modified':
                return 'bar-modified';
            case 'deleted':
                return 'bar-deleted';
            case 'reordered':
                return 'bar-reordered';
            default:
                return 'bar-none';
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
                className={`change-bar ${getChangeBarClass()}${isFadingOut ? ' fade-out' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={{ cursor: 'pointer' }}
            />
        </Tooltip>
    );
};

export default ChangeBar;
