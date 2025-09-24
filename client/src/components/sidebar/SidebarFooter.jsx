// File: client/src/components/sidebar/SidebarFooter.jsx

import React from 'react';

/**
 * サイドバーのフッター部分（サブルーム一覧）
 * @param {Object} props - プロパティ
 * @param {Array} props.rooms - ルーム一覧
 * @param {string} props.activeRoomId - アクティブなルームID
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {boolean} props.switchingRoom - ルーム切り替え中かどうか
 * @param {Function} props.onRoomClick - ルームクリック時のハンドラ
 */
const SidebarFooter = ({ 
    rooms, 
    activeRoomId, 
    isColorfulMode, 
    switchingRoom, 
    onRoomClick 
}) => {
    return (
        <div className="sb-footer">
            {/* サブルーム一覧セクション */}
            <div className="sb-section-wrapper">
                <div className="sb-section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="sb-section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="sidebar-text">
                        <h2 className="sb-section-title">サブルーム一覧</h2>
                    </div>
                </div>

                <div className="sb-items-container sidebar-text">
                    {rooms.sort((a, b) => a.id.localeCompare(b.id)).map(room => (
                        <button
                            key={room.id}
                            onClick={() => onRoomClick(room.id)}
                            className={`sb-room-button ${activeRoomId === room.id ? 'active' : ''
                                } ${isColorfulMode ? 'colorful-mode' : ''} ${switchingRoom ? 'switching' : ''
                                }`}
                            disabled={switchingRoom}
                        >
                            <div className="sb-room-info">
                                <span className="sb-room-name">{room.name}</span>
                                {switchingRoom && activeRoomId === room.id && (
                                    <div className="sb-loading-container">
                                        <div className="sb-dot-loader"></div>
                                    </div>
                                )}
                                <span className="sb-room-participants">
                                    {room.participantCount}人
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SidebarFooter;