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
        <div className={'sb-nav-icons'}>
            <div>
                <button onClick={onToggle} className="sb-toggle-button close">
                    <div className="sb-nav-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                    </div>
                </button>
                <span className='closed-icons-text'>メニュー</span>
            </div>
            
            <div>
                <div className="sb-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <span className='closed-icons-text'>#{latestHeading}</span>
            </div>
            
            <div>
                <div className="sb-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <span className='closed-icons-text'>
                    {activeRoom ? activeRoom.name : '全体'}<br />
                    {activeRoom ? activeRoom.participantCount : 0}人
                </span>
            </div>
        </div>
    );
};

export default SidebarClosed;