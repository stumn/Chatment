// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';

const ChatRow = React.lazy(() => import('./ChatRow'));

import usePostStore from '../../../store/spaces/postStore';

const ChatComments = ({ lines, bottomHeight, chatFunctions, isChatMaximized }) => {
    const listRef = useRef(null);
    const posts = usePostStore((state) => state.posts);

    const chatMessages = useMemo(() => {

        // createdAt または updatedAt でソート resizable de useState update vs create の差をマークしておく
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
        });

        // ★空白行を除外 + ソース情報でフィルタリング
        const filtered = sorted.filter(msg => {
            // 基本的な空白行除外
            if (!msg || !msg.msg || msg.msg.trim() === "") return false;

            // ソース情報による判定
            // - 'chat' ソース: 常に表示（チャット入力からの投稿）
            // - 'document' ソース: 見出し以外は表示（ドキュメント編集からの通常テキスト）
            // - ソース不明（既存データ）: 見出し行は除外
            if (msg.source === 'chat') { return true; }
            else if (msg.source === 'document') { return !msg.msg.trim().startsWith('#'); }
            else { return !msg.msg.trim().startsWith('#'); }
        });

        // 最大化モードの場合は全件表示、通常モードは制限付き
        const displayMessages = isChatMaximized ? filtered : filtered.slice(-Math.ceil(lines.num));

        // timeプロパティを生成して付与
        return displayMessages.map(msg => ({
            ...msg,
            time: msg.updatedAt
                ? new Date(msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''
        }));

    }, [posts, lines.num, isChatMaximized]);

    // idがundefinedなものを除外し、重複idも除外
    const filteredChatMessages = chatMessages.filter((msg, idx, arr) => msg && msg.id !== undefined && arr.findIndex(m => m.id === msg.id) === idx);

    // スクロールを最下部に（モード切替時も含む）
    useEffect(() => {
        if (listRef.current) {
            if (isChatMaximized) {
                // react-windowの場合
                if (filteredChatMessages.length > 0) {
                    listRef.current.scrollToItem(filteredChatMessages.length - 1, "end");
                }
            } else {
                // 通常モードの場合
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        }
    }, [filteredChatMessages, isChatMaximized]);

    const {
        chat: { send, addPositive, addNegative, votePoll },
        socket: { id: socketId }
    } = chatFunctions;

    // itemDataを準備
    const itemData = useMemo(() => ({
        chatMessages: filteredChatMessages,
        sendChatMessage: send,
        userSocketId: socketId,
        addPositive,
        addNegative
    }), [filteredChatMessages, send, socketId, addPositive, addNegative]);

    // react-window用のrenderRow
    const renderRow = ({ index, style, data }) => (
        <ChatRow
            data={data}
            index={index}
            style={style}
        />
    );
    // react-windowの場合、keyはListのitemKeyで管理されるため、ChatRowには不要

    // 最大化モード：react-windowを使用
    if (isChatMaximized) {
        return (
            <React.Suspense fallback={<div>Loading...</div>}>
                <List
                    ref={listRef}
                    height={bottomHeight}
                    itemCount={filteredChatMessages.length}
                    itemSize={65} // 固定高さ65px
                    width="100%"
                    itemData={itemData}
                    itemKey={(index, data) => data.chatMessages[index]?.id || index}
                    style={{ overflowY: 'auto' }}
                >
                    {renderRow}
                </List>
            </React.Suspense>
        );
    }

    // 通常モード：制限された行数のみ表示（下揃え）
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <div
                ref={listRef}
                className="flex flex-col justify-end w-full text-left"
                style={{
                    height: bottomHeight,
                    overflowY: 'hidden',
                }}
            >
                {filteredChatMessages.map((msg, idx) => (
                    <ChatRow
                        key={msg.id || idx}
                        data={itemData}
                        index={idx}
                        style={{}}
                    />
                ))}
            </div>
        </React.Suspense>
    );
};

export default ChatComments;