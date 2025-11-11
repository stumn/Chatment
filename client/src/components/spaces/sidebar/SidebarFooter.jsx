// File: client/src/components/sidebar/SidebarFooter.jsx

import React from 'react';
import useSubRoomControl from '../../../hooks/useSubRoomControl';

/**
 * サイドバーのフッター部分（サブルーム一覧）
 * @param {Object} props - プロパティ
 * @param {Array} props.rooms - ルーム一覧
 * @param {string} props.activeRoomId - アクティブなルームID
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {boolean} props.switchingRoom - ルーム切り替え中かどうか
 * @param {Function} props.handleRoomClick - ルームクリック時のハンドラ
 */
const SidebarFooter = ({ 
    rooms, 
    activeRoomId, 
    isColorfulMode, 
    switchingRoom, 
    handleRoomClick 
}) => {
    // サブルーム制御ロジックを取得
    const {
        shouldShowRoomList,
        displayInfo,
        isSubRoomEnabled,
        mainRoom,
        subRooms,
        logCurrentState
    } = useSubRoomControl();

    // デバッグ用: 現在の状態をログ出力
    React.useEffect(() => {
        logCurrentState();
    }, [shouldShowRoomList, rooms.length]);

    // サブルーム機能が無効、またはルームが1つ以下の場合は非表示
    if (!shouldShowRoomList) {
        return null;
    }

    return (
        <div className="flex-shrink-0 px-6 pb-6 bg-gray-100 border-t border-gray-200 max-h-[30vh] overflow-y-auto">
            {/* サブルーム一覧セクション */}
            <div className="mb-0">
                <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="sidebar-text">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">サブルーム一覧</h2>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sidebar-text">
                    {rooms.sort((a, b) => a.id.localeCompare(b.id)).map(room => (
                        <button
                            key={room.id}
                            onClick={() => handleRoomClick(room.id)}
                            className={`w-full p-3 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 text-left font-inherit flex justify-between items-center sb-room-button ${activeRoomId === room.id ? 'active' : ''
                                } ${isColorfulMode ? 'colorful-mode' : ''} ${switchingRoom ? 'switching' : ''
                                }`}
                            disabled={switchingRoom}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className="text-sm font-normal text-inherit">{room.name}</span>
                                {switchingRoom && activeRoomId === room.id && (
                                    <div className="flex items-center justify-center ml-2">
                                        <div className="sb-dot-loader"></div>
                                    </div>
                                )}
                                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                    {room.participantCount || 0}人
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