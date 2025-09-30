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
        <div className="fixed top-0 left-0 h-screen w-20 bg-gray-100 border-r border-gray-200 z-[1000] flex flex-col transition-[width] duration-300 font-[Inter,sans-serif] overflow-hidden items-center gap-4 border-b border-gray-200">
            <div className="text-center">
                <button onClick={onToggle} className="mt-6 px-0 rounded-full bg-transparent border-none cursor-pointer text-gray-500 transition-all duration-200 flex text-left justify-center h-auto w-auto hover:bg-gray-200 hover:text-gray-700">
                    <div className="p-2 rounded-lg text-gray-500 transition-all duration-200 flex items-center justify-center w-12 h-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                    </div>
                </button>
                <span className="text-gray-500 text-sm text-center">メニュー</span>
            </div>
            
            <div className="text-center">
                <div className="p-2 rounded-lg text-gray-500 transition-all duration-200 flex items-center justify-center w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <span className="text-gray-500 text-sm text-center">#{latestHeading}</span>
            </div>
            
            <div className="text-center">
                <div className="p-2 rounded-lg text-gray-500 transition-all duration-200 flex items-center justify-center w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <span className="text-gray-500 text-sm text-center">
                    {activeRoom ? activeRoom.name : '全体'}<br />
                    {activeRoom ? activeRoom.participantCount : 0}人
                </span>
            </div>
        </div>
    );
};

export default SidebarClosed;