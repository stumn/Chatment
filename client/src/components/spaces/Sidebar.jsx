// File: client/src/Sidebar.jsx

import React, { useMemo } from 'react';
import usePostStore from '../../store/spaces/postStore';
import useAppStore from '../../store/spaces/appStore';
import useRoomStore from '../../store/spaces/roomStore';
import SidebarClosed from './sidebar/SidebarClosed';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarContent from './sidebar/SidebarContent';
import './sidebar/sidebar.css';

const Sidebar = ({ isOpen, onToggle, userInfo: propsUserInfo, spaceId }) => {
    // TODO: spaceIdに基づいてスペース固有の投稿データをフィルタリング
    // TODO: スペースタイトルや説明などの情報を表示
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    const toggleColorfulMode = useAppStore((state) => state.toggleColorfulMode);
    const isCompactMode = useAppStore((state) => state.isCompactMode);
    const toggleCompactMode = useAppStore((state) => state.toggleCompactMode);
    const isChatScrollMode = useAppStore((state) => state.isChatScrollMode);
    const toggleChatScrollMode = useAppStore((state) => state.toggleChatScrollMode);
    const userInfo = propsUserInfo || useAppStore((state) => state.userInfo);

    // ルーム関連の状態（サブルーム廃止により簡略化）
    const { activeRoomId } = useRoomStore();

    // 見出し投稿のみを抽出（フィルター用）
    const headings = useMemo(() => {
        return posts
            .filter(post => post.msg && post.msg.trim().startsWith('#'))
            .sort((a, b) => a.displayOrder - b.displayOrder);
    }, [posts]);

    // 直近の見出しを取得
    const latestHeading = useMemo(() => {
        if (headings.length === 0) return '見出しなし';
        const lastHeading = headings[headings.length - 1];
        return lastHeading.msg.replace(/^#+\s*/, '');
    }, [headings]);

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
                isChatScrollMode={isChatScrollMode}
                toggleChatScrollMode={toggleChatScrollMode}
            />

            <SidebarContent
                headings={headings}
                isColorfulMode={isColorfulMode}
            />
        </div>
    );
};

export default Sidebar;
