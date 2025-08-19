// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';

import usePostStore from './store/postStore';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み
import './chat.css'; // スタイルをインポート

const ChatComments = ({ lines, bottomHeight, chatFunctions }) => {
    const listRef = useRef(null);
    const posts = usePostStore((state) => state.posts);

    const chatMessages = useMemo(() => {
        
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
        });
        // ★空白行を除外
        const filtered = sorted.filter(msg => msg && msg.msg && msg.msg.trim() !== "");
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
    const chatCount = filteredChatMessages.length;

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

    // Listの代わりにdiv+mapで描画
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <div
                ref={listRef}
                style={{
                    height: bottomHeight,
                    overflowY: 'hidden',
                    width: '100%',
                    textAlign: 'left',
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