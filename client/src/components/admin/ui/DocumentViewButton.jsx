import React from 'react';

/**
 * ドキュメント閲覧ボタンコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {number} props.spaceId - スペースID
 * @param {string} props.className - 追加のCSSクラス（オプション）
 */
const DocumentViewButton = ({ spaceId, className = "" }) => {
  const handleViewDocument = () => {
    // 新しいタブでスペースのログ閲覧ページを開く
    const logUrl = `/document/${spaceId}/0`;
    window.open(logUrl, '_blank');
  };

  return (
    <button
      className={`px-4 py-2 !bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-blue-600 transition-colors duration-150 ${className}`}
      onClick={handleViewDocument}
    >
      Doc
    </button>
  );
};

export default DocumentViewButton;