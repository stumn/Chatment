// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';

const ChatRow = React.lazy(() => import('./ChatRow'));

import usePostStore from '../../../store/spaces/postStore';

const ChatComments = ({ lines, bottomHeight, chatFunctions }) => {
    const listRef = useRef(null);
    const posts = usePostStore((state) => state.posts);

    const chatMessages = useMemo(() => {

        // createdAt または updatedAt でソート
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
            // - ソース不明（既存データ）: 見出し行であっても表示（後方互換性）
            if (msg.source === 'chat') {
                return true; // チャット入力からの投稿は常に表示
            } else if (msg.source === 'document') {
                return !msg.msg.trim().startsWith('#'); // ドキュメント編集からの見出し以外は表示
            } else {
                // 既存データ（sourceフィールドなし）の場合、見出し行であっても表示（後方互換性）
                return true;
            }
        });

        // timeプロパティを生成して付与
        return filtered.slice(-Math.ceil(lines.num)).map(msg => ({
            ...msg,
            time: msg.updatedAt
                ? new Date(msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''
        }));

    }, [posts, lines.num]);

    // idがundefinedなものを除外し、重複idも除外
    const filteredChatMessages = chatMessages.filter((msg, idx, arr) => msg && msg.id !== undefined && arr.findIndex(m => m.id === msg.id) === idx);

    // スクロールを最下部に
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [filteredChatMessages]);

    const {
        chat: { send, addPositive, addNegative },
        socket: { id: socketId }
    } = chatFunctions;

    // Listの代わりにdiv+mapで描画（下揃え表示）
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
                        data={{
                            chatMessages: filteredChatMessages,
                            sendChatMessage: send,
                            userSocketId: socketId,
                            addPositive,
                            addNegative
                        }}
                        index={idx}
                        style={{}}
                    />
                ))}
            </div>
        </React.Suspense>
    );
};

export default ChatComments;