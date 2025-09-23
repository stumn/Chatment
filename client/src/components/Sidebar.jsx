// File: client/src/Sidebar.jsx

import React, { useState, useMemo } from 'react';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import usePostStore from '../store/postStore';
import useAppStore from '../store/appStore';
import useRoomStore from '../store/roomStore';
import useSocket from '../hooks/useSocket';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    const toggleColorfulMode = useAppStore((state) => state.toggleColorfulMode);
    const userInfo = useAppStore((state) => state.userInfo);

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

    // 直近の見出しを取得
    const latestHeading = useMemo(() => {
        if (tocData.length === 0) return '見出しなし';
        const lastSection = tocData[tocData.length - 1];
        return lastSection.msg.replace(/^#+\s*/, '');
    }, [tocData]);

    // アクティブルーム情報を取得
    const activeRoom = useMemo(() => {
        return rooms.find(room => room.id === activeRoomId);
    }, [rooms, activeRoomId]);

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
                </div>                <div>
                    <div className="sb-nav-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <span className='closed-icons-text'>{activeRoom ? activeRoom.name : '全体'}<br />{activeRoom ? activeRoom.participantCount : 0}人</span>
                </div>
            </div>
        )
    }


    return (
        <div className={'sb-sidebar-container open'}>

            {/* ヘッダーセクション - 固定領域 */}
            <div className="sb-header">
                <button onClick={onToggle} className="sb-toggle-button open">
                    <svg xmlns="http://www.w3.org/2000/svg" className="sb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* ユーザー情報と現在のステータス */}
                <div className="sb-user-info sidebar-text">
                    <span className="sb-user-name">
                        {userInfo?.nickname ? `${userInfo.nickname} (${userInfo.ageGroup} ${userInfo.status})さん` : 'ゲスト'}
                    </span>
                    <div className="sb-colorful-mode">
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isColorfulMode}
                                        onChange={toggleColorfulMode}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label="カラフルモード"
                                labelPlacement="start"
                                sx={{
                                    margin: 0,
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '12px',
                                        color: '#666'
                                    }
                                }}
                            />
                        </FormGroup>
                    </div>
                </div>

            </div>

            {/* スクロール可能なメインコンテンツセクション */}
            <div className="sb-scrollable-content">
                {/* チャプターと注目コメントセクション */}
                <div className="sb-chapter-section">
                    {/* タイトル部分 - 固定 */}
                    <div className="sb-section-header sidebar-text">
                        <svg xmlns="http://www.w3.org/2000/svg" className="sb-section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h2 className="sb-section-title">チャプターと注目コメント</h2>
                        </div>
                    </div>

                    {/* スクロール可能なリスト部分 */}
                    <div className="sb-chapter-list sidebar-text">
                        <div className="sb-items-container">
                            {tocData.length === 0 ? (
                                <div className="sb-empty-message">
                                    見出しや注目コメントがありません
                                </div>
                            ) : (
                                tocData.map(section => (
                                    <div key={section.id} className="sb-section">
                                        {/* 見出し */}
                                        <button
                                            onClick={() => handleItemClick(section.id)}
                                            className={`sb-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                        >
                                            {section.msg.replace(/^#+\s*/, '')}
                                        </button>

                                        {/* ネストされた注目コメント */}
                                        {section.comments.length > 0 && (
                                            section.comments.map(comment => (
                                                <button
                                                    key={comment.id}
                                                    onClick={() => handleItemClick(comment.id)}
                                                    className="sb-comment-button"
                                                >
                                                    <div className="sb-comment-text">
                                                        {comment.msg}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* フッターセクション - 固定領域 */}
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
                                        {room.participantCount}人
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
