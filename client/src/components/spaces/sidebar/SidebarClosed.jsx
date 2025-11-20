// File: client/src/components/sidebar/SidebarClosed.jsx

import React from 'react';

/**
 * サイドバーが閉じている状態のコンポーネント
 * @param {Object} props - プロパティ
 * @param {Function} props.onToggle - サイドバーを開く関数
 * @param {string} props.latestHeading - 最新の見出しテキスト
 * @param {Object} props.activeRoom - アクティブなルーム情報
 */
const SidebarClosed = ({ onToggle, latestHeading, activeRoom }) => {
    return (
        <button
            onClick={onToggle}
            className="fixed left-5 top-6 z-[1000] !w-12 !h-12 min-w-12 min-h-12 aspect-square !rounded-full !bg-white border border-gray-200 cursor-pointer shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 hover:!bg-gray-50 hover:scale-105"
            title="サイドバーを開く"
        >
            <span className="w-5 h-0.5 bg-gray-700 rounded"></span>
            <span className="w-5 h-0.5 bg-gray-700 rounded"></span>
            <span className="w-5 h-0.5 bg-gray-700 rounded"></span>
        </button>
    );
};

export default SidebarClosed;