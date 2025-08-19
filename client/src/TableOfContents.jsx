// File: client/src/TableOfContents.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from './store/postStore';
import useAppStore from './store/appStore';
import useRoomStore from './store/roomStore';
import useSocket from './hooks/useSocket';
import './Toc.css';

const TableOfContents = ({ isOpen, onToggle }) => {
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

    if (!isOpen) {
        return (
            <div className="toc-tab-closed" onClick={onToggle}>
                <div className="toc-tab-text">
                    目次
                </div>
            </div>
        );
    }

    return (
        <div className="toc-panel">
            {/* ヘッダー */}
            <div className="toc-header">
                <h3 className="toc-title">
                    チャプターと注目コメント
                </h3>
                <button
                    onClick={onToggle}
                    className="toc-close-button"
                >
                    ×
                </button>
            </div>

            {/* コンテンツ */}
            <div className="toc-content">
                {tocData.length === 0 ? (
                    <div className="toc-empty-message">
                        見出しや注目コメントがありません
                    </div>
                ) : (
                    <ul className="toc-list">
                        {tocData.map(section => (
                            <li key={section.id} className="toc-section">
                                {/* 見出し */}
                                <button
                                    onClick={() => handleItemClick(section.id)}
                                    className={`toc-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                >
                                    <span className="toc-heading-icon">#</span>
                                    <span className="toc-heading-text">
                                        {section.msg.replace(/^#+\s*/, '')}
                                    </span>
                                </button>

                                {/* ネストされた注目コメント */}
                                {section.comments.length > 0 && (
                                    <ul className={`toc-comments-list ${isColorfulMode ? 'colorful-mode' : ''}`}>
                                        {section.comments.map(comment => (
                                            <li key={comment.id} className="toc-comment-item">
                                                <button
                                                    onClick={() => handleItemClick(comment.id)}
                                                    className="toc-comment-button"
                                                >
                                                    <div className="toc-comment-text">
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
            <div className="toc-rooms">
                <h4 className="toc-room-title" style={{ textAlign: 'left' }}>ルーム一覧</h4>
                <ul className="toc-room-list">
                    {rooms.sort((a, b) => a.id.localeCompare(b.id)).map(room => (
                        <li key={room.id} className="toc-room-item">
                            <button
                                onClick={() => handleRoomClick(room.id)}
                                className={`toc-room-button ${activeRoomId === room.id ? 'active' : ''
                                    } ${isColorfulMode ? 'colorful-mode' : ''} ${switchingRoom ? 'switching' : ''
                                    }`}
                                disabled={switchingRoom}
                            >
                                <div className="toc-room-info">
                                    
                                    <span className="toc-room-name">{room.name}</span>

                                    {switchingRoom && activeRoomId === room.id && (
                                        <div className="toc-loading-container">
                                            <div className="toc-dot-loader"></div>
                                        </div>
                                    )}
                                    
                                    <span className="toc-room-participants">
                                        ({room.participantCount}人)
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

export default TableOfContents;
