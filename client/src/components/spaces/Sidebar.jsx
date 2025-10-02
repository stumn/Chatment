// File: client/src/Sidebar.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from '../../store/spaces/postStore';
import useAppStore from '../../store/spaces/appStore';
import useRoomStore from '../../store/spaces/roomStore';
import useSocket from '../../hooks/shared/useSocket';
import SidebarClosed from './sidebar/SidebarClosed';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarContent from './sidebar/SidebarContent';
import SidebarFooter from './sidebar/SidebarFooter';
import '../../styles/sidebar.css';

const Sidebar = ({ isOpen, onToggle, userInfo: propsUserInfo, spaceId }) => {
    // TODO: spaceIdに基づいてスペース固有の投稿データをフィルタリング
    // TODO: スペースタイトルや説明などの情報を表示
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    const toggleColorfulMode = useAppStore((state) => state.toggleColorfulMode);
    const userInfo = propsUserInfo || useAppStore((state) => state.userInfo);

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
        // TODO: 後で実装予定：該当の投稿位置にスクロール
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
        if (activeRoomId === roomId) return;

        // 切り替え中の状態を設定
        setSwitchingRoom(true);

        // 現在のルームから退出（異なるルームの場合のみ）
        if (activeRoomId && activeRoomId !== roomId) {
            emitLeaveRoom(activeRoomId);
        }

        // ローカルストアを先に更新（UI反応の高速化）
        setActiveRoom(roomId);

        // 新しいルームに参加
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
            <SidebarClosed
                onToggle={onToggle}
                latestHeading={latestHeading}
                activeRoom={activeRoom}
            />
        );
    }


    return (
        <div className={'sb-sidebar-container open'}>
            <SidebarHeader
                onToggle={onToggle}
                spaceId={spaceId}
                userInfo={userInfo}
                isColorfulMode={isColorfulMode}
                toggleColorfulMode={toggleColorfulMode}
            />

            <SidebarContent
                tocData={tocData}
                handleItemClick={handleItemClick}
                isColorfulMode={isColorfulMode}
            />

            <SidebarFooter
                rooms={rooms}
                activeRoomId={activeRoomId}
                handleRoomClick={handleRoomClick}
                isColorfulMode={isColorfulMode}
                switchingRoom={switchingRoom}
            />
        </div>
    );
};

export default Sidebar;
