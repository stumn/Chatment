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
        // 新しいタブでログ分析ページを開く
        const logAnalysisUrl = `/log-analysis/${spaceId}`;
        window.open(logAnalysisUrl, '_blank');
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
