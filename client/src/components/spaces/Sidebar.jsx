// File: client/src/Sidebar.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from '../../store/spaces/postStore';
import useAppStore from '../../store/spaces/appStore';
import useRoomStore from '../../store/spaces/roomStore';
import useSocket from '../../hooks/shared/useSocket';
import SidebarClosed from './sidebar/SidebarClosed';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarContent from './sidebar/SidebarContent';
import './sidebar/sidebar.css';

const Sidebar = ({ isOpen, onToggle, userInfo: propsUserInfo, spaceId, scrollToItemById }) => {
    // TODO: spaceIdに基づいてスペース固有の投稿データをフィルタリング
    // TODO: スペースタイトルや説明などの情報を表示
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    const toggleColorfulMode = useAppStore((state) => state.toggleColorfulMode);
    const isCompactMode = useAppStore((state) => state.isCompactMode);
    const toggleCompactMode = useAppStore((state) => state.toggleCompactMode);
    const userInfo = propsUserInfo || useAppStore((state) => state.userInfo);

    // ルーム関連の状態（サブルーム廃止により簡略化）
    const { activeRoomId } = useRoomStore();

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
        if (scrollToItemById) {
            scrollToItemById(postId);
        } else {
            console.warn('scrollToItemById function is not available yet');
        }
    };

    // 直近の見出しを取得
    const latestHeading = useMemo(() => {
        if (tocData.length === 0) return '見出しなし';
        const lastSection = tocData[tocData.length - 1];
        return lastSection.msg.replace(/^#+\s*/, '');
    }, [tocData]);

    // アクティブルーム情報を取得（サブルーム廃止により常に"全体"ルーム）
    const activeRoom = useMemo(() => {
        return {
            id: activeRoomId,
            name: '全体'
        };
    }, [activeRoomId]);

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
                isCompactMode={isCompactMode}
                toggleCompactMode={toggleCompactMode}
            />

            <SidebarContent
                tocData={tocData}
                onItemClick={handleItemClick}
                isColorfulMode={isColorfulMode}
            />
        </div>
    );
};

export default Sidebar;
