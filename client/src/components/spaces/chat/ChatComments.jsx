// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';

const ChatRow = React.lazy(() => import('./ChatRow'));

import usePostStore from '../../../store/spaces/postStore';
import useAppStore from '../../../store/spaces/appStore';

const ChatComments = ({ lines, bottomHeight, chatFunctions, isChatMaximized, isChatScrollMode }) => {
    const listRef = useRef(null);
    const posts = usePostStore((state) => state.posts);

    // フィルター状態を取得
    const selectedHeadingId = useAppStore((state) => state.selectedHeadingId);
    const indentFilter = useAppStore((state) => state.indentFilter);
    const minLikesFilter = useAppStore((state) => state.minLikesFilter);

    const chatMessages = useMemo(() => {

        // 見出しが見つからない状態をリセット
        let isHeadingMissing = false;

        // createdAt または updatedAt でソート resizable de useState update vs create の差をマークしておく
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
        });

        // ★空白行を除外 + ソース情報でフィルタリング
        let filtered = sorted.filter(msg => {
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

        // 見出しフィルターを適用（displayOrderベースで範囲を絞る）
        if (selectedHeadingId) {
            // displayOrderでソートされた全投稿から見出しを探す
            const sortedByOrder = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);
            const selectedIndex = sortedByOrder.findIndex(p => p.id === selectedHeadingId);

            if (selectedIndex !== -1) {
                const selectedPost = sortedByOrder[selectedIndex];
                // 次の見出しを探す
                const nextHeadingIndex = sortedByOrder.findIndex((p, idx) =>
                    idx > selectedIndex && p.msg && p.msg.trim().startsWith('#')
                );

                // displayOrderの範囲を決定
                const minOrder = selectedPost.displayOrder;
                const maxOrder = nextHeadingIndex !== -1
                    ? sortedByOrder[nextHeadingIndex].displayOrder
                    : Infinity;

                // その範囲内のメッセージのみを残す
                filtered = filtered.filter(msg =>
                    msg.displayOrder >= minOrder && msg.displayOrder < maxOrder
                );
            } else {
                // 選択された見出しが見つからない場合
                isHeadingMissing = true;
            }
        }

        // インデントフィルターを適用（指定された値以下のインデントレベルを表示）
        if (indentFilter !== null) {
            filtered = filtered.filter(msg => (msg.indentLevel || 0) <= indentFilter);
        }

        // いいね数フィルターを適用
        if (minLikesFilter !== null && minLikesFilter > 0) {
            filtered = filtered.filter(msg => (msg.positive || 0) >= minLikesFilter);
        }

        // 最大化モードまたはチャットスクロールモードの場合は全件表示、通常モードは制限付き
        const displayMessages = (isChatMaximized || isChatScrollMode) ? filtered : filtered.slice(-Math.ceil(lines.num));

        // timeプロパティを生成して付与
        return {
            messages: displayMessages.map(msg => ({
                ...msg,
                time: msg.updatedAt
                    ? new Date(msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''
            })),
            headingNotFound: isHeadingMissing
        };

    }, [posts, lines.num, isChatMaximized, isChatScrollMode, selectedHeadingId, indentFilter, minLikesFilter]);

    // idがundefinedなものを除外し、重複idも除外（O(n)の効率的な実装）
    const seen = new Set();
    const filteredChatMessages = chatMessages.messages.filter(msg => msg?.id && !seen.has(msg.id) && seen.add(msg.id));

    // 見出しが見つからない場合にアラートを表示
    useEffect(() => {
        if (chatMessages.headingNotFound) {
            alert('選択された見出しが存在しません。見出しが削除された可能性があります。');
        }
    }, [chatMessages.headingNotFound]);

    // スクロールを最下部に（モード切替時も含む）
    useEffect(() => {
        if (listRef.current) {
            if (isChatMaximized || isChatScrollMode) {
                // react-windowの場合またはチャットスクロールモードの場合
                if (filteredChatMessages.length > 0) {
                    if (isChatMaximized) {
                        // react-windowの場合
                        listRef.current.scrollToItem(filteredChatMessages.length - 1, "end");
                    } else {
                        // チャットスクロールモードの通常表示の場合
                        listRef.current.scrollTop = listRef.current.scrollHeight;
                    }
                }
            } else {
                // 通常モードの場合
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        }
    }, [filteredChatMessages, isChatMaximized, isChatScrollMode]);

    const {
        chat: { send, addPositive, addNegative },
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

    // チャットスクロールモード：すべてのメッセージをスクロール表示
    if (isChatScrollMode) {
        return (
            <React.Suspense fallback={<div>Loading...</div>}>
                <div
                    ref={listRef}
                    className="flex flex-col w-full text-left"
                    style={{
                        height: bottomHeight,
                        overflowY: 'auto',
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