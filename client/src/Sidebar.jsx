// File: client/src/Sidebar.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from './store/postStore';
import useAppStore from './store/appStore';
import useRoomStore from './store/roomStore';
import useSocket from './hooks/useSocket';
import './sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);

    // ルーム関連の状態
    const { rooms, activeRoomId, setActiveRoom, switchingRoom, setSwitchingRoom } = useRoomStore();

    // ソケット通信関数を取得
    const { emitJoinRoom, emitLeaveRoom, emitGetRoomList, emitFetchRoomHistory } = useSocket();

    // 目次データを生成
    const tocData = useMemo(() => {
        const result = [];
        let currentSection = null;

        // displayOrder順でソート
        const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);

        sortedPosts.forEach(post => {
            // 見出しの場合、新しいセクションを開始
            if (post.msg && post.msg.trim().startsWith('#')) {
                currentSection = {
                    ...post,
                    comments: []
                };
                result.push(currentSection);
            }
            // 注目のコメント（リアクション数が10以上）の場合、現在のセクションに追加
            else if ((post.positive + post.negative) >= 10 && post.msg && post.msg.trim() !== '') {
                if (currentSection) {
                    currentSection.comments.push(post);
                } else {
                    // 見出しがない場合は、最初のセクションとして追加
                    result.push({
                        id: `section-${post.id}`,
                        msg: '# その他の注目コメント',
                        displayOrder: post.displayOrder,
                        positive: 0,
                        negative: 0,
                        comments: [post]
                    });
                }
            }
        });

        return result;
    }, [posts]);

    const handleItemClick = (postId) => {
        // 後で実装予定：該当の投稿位置にスクロール
        console.log('TOC item clicked:', postId);
    };

    const handleRoomClick = (roomId) => {
        console.log(`🎯 [TableOfContents] ルーム選択開始: ${roomId}`);
        console.log(`📊 [TableOfContents] 現在のアクティブルーム: ${activeRoomId}`);

        // 同じルームの場合は何もしない
        if (activeRoomId === roomId) {
            console.log(`✅ [TableOfContents] 既に ${roomId} にいるため処理スキップ`);
            return;
        }

        // 切り替え中の状態を設定
        setSwitchingRoom(true);

        // 現在のルームから退出（異なるルームの場合のみ）
        if (activeRoomId && activeRoomId !== roomId) {
            console.log(`👋 [TableOfContents] 前のルーム ${activeRoomId} から退出中...`);
            emitLeaveRoom(activeRoomId);
        }

        // ローカルストアを先に更新（UI反応の高速化）
        setActiveRoom(roomId);

        // 新しいルームに参加
        console.log(`🚀 [TableOfContents] 新しいルーム ${roomId} に参加中...`);
        emitJoinRoom(roomId);

        // ルーム履歴を事前に取得（キャッシュされていない場合のみ）
        emitFetchRoomHistory(roomId);

        // 少し待ってから切り替え状態をクリア
        setTimeout(() => {
            setSwitchingRoom(false);
        }, 2000);

        console.log(`✅ [TableOfContents] ルーム選択完了: ${roomId}`);
    };

    return (
        <>
            {/* 閉じた状態のタブ */}
            {!isOpen && (
                <div className="sb-tab-closed" onClick={onToggle}>
                    <div className="sb-tab-text">
                        目次
                    </div>
                </div>
            )}

            {/* パネル本体（常にレンダリング、CSSで制御） */}
            <div className={`sb-panel ${!isOpen ? 'closed' : ''}`}>
                {/* ヘッダー */}
                <div className="sb-header">
                    <h3 className="sb-title">
                        #チャプターと<br />注目コメント
                    </h3>
                    <button
                        onClick={onToggle}
                        className="sb-close-button"
                    >
                    ×
                </button>
            </div>

            {/* コンテンツ */}
            <div className="sb-content">
                {tocData.length === 0 ? (
                    <div className="sb-empty-message">
                        見出しや注目コメントがありません
                    </div>
                ) : (
                    <ul className="sb-list">
                        {tocData.map(section => (
                            <li key={section.id} className="sb-section">
                                {/* 見出し */}
                                <button
                                    onClick={() => handleItemClick(section.id)}
                                    className={`sb-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                >
                                    <span className="sb-heading-icon">#</span>
                                    <span className="sb-heading-text">
                                        {section.msg.replace(/^#+\s*/, '')}
                                    </span>
                                </button>

                                {/* ネストされた注目コメント */}
                                {section.comments.length > 0 && (
                                    <ul className={`sb-comments-list ${isColorfulMode ? 'colorful-mode' : ''}`}>
                                        {section.comments.map(comment => (
                                            <li key={comment.id} className="sb-comment-item">
                                                <button
                                                    onClick={() => handleItemClick(comment.id)}
                                                    className="sb-comment-button"
                                                >
                                                    <div className="sb-comment-text">
                                                        {comment.msg}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ルーム一覧 */}
            <div className="sb-rooms">
                <h4 className="sb-room-title" style={{ textAlign: 'left' }}>サブルーム一覧</h4>
                <ul className="sb-room-list">
                    {rooms.sort((a, b) => a.id.localeCompare(b.id)).map(room => (
                        <li key={room.id} className="sb-room-item">
                            <button
                                onClick={() => handleRoomClick(room.id)}
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
                                        ({room.participantCount}人)
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
        </>
    );
};

export default Sidebar;
