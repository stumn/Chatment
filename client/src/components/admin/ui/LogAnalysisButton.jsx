import React from 'react';

/**
 * ログ分析ボタンコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {number} props.spaceId - スペースID
 * @param {string} props.className - 追加のCSSクラス（オプション）
 */
const LogAnalysisButton = ({ spaceId, className = "" }) => {
    const handleOpenLogAnalysis = () => {
        // 新しいタブでログ分析ページを開く（opener を無効化してタブナビングを防止）
        const logAnalysisUrl = `/log-analysis/${spaceId}`;
        const newWindow = window.open(logAnalysisUrl, '_blank', 'noopener,noreferrer');
        if (newWindow) {
            newWindow.opener = null;
        }
    };

    return (
        <button
            className={`px-4 py-2 !bg-purple-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-purple-600 transition-colors duration-150 ${className}`}
            onClick={handleOpenLogAnalysis}
            title="ログ分析"
        >
            Log
        </button>
    );
};

export default LogAnalysisButton;
