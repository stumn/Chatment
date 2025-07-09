// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';

import usePostStore from './store/postStore';
import useSocket from './store/useSocket';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み

const ChatComments = ({ lines, bottomHeight, emitChatMessage }) => {
    const listRef = useRef(null);
    // const chatMessages = usePostStore((state) => state.getChatMessages(Math.ceil(lines.num)));
    const posts = usePostStore((state) => state.posts);
    const chatMessages = useMemo(() => {
        // getChatMessagesのロジックをここに移植
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
        });
        // timeプロパティを生成して付与
        return sorted.slice(-Math.ceil(lines.num)).map(msg => ({
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
            listRef.current.scrollToItem(filteredChatMessages.length - 1, 'end');
        }
    }, [filteredChatMessages]);

    const getItemSize = (index) => {
        const cMsg = filteredChatMessages[index];

        // メッセージデータが存在しない場合のデフォルトの高さ
        if (!cMsg) {
            return 62; // 例: デフォルトの高さを62pxとする
        }

        // --- ChatRow.jsxのロジックを反映 ---
        // ChatRow.jsxで定義されている値と合わせる
        const FONT_SIZE = 15;
        const MULTIPLIER = 1.1;
        const favCount = cMsg.fav || 0; // favプロパティが存在しない場合に備える
        const fontSize = FONT_SIZE + favCount * MULTIPLIER;

        // --- 各パーツの高さを計算 ---

        // 1. 「名前+タイムスタンプ」行の高さ
        // この行は常に1行。フォントサイズに行間の余白を加味する（例: 8px）
        const nameLineHeight = fontSize + 8;

        // 2. 「メッセージ」本文の高さ
        const msg = cMsg.msg || '';
        // 1行あたりの平均文字数。本来はコンテナの幅に依存するが、ここでは30文字と仮定。
        const charsPerLine = 30;
        // メッセージが行を折り返す数を推定（最低1行）
        const estimatedMsgLines = Math.ceil(msg.length / charsPerLine) || 1;
        // メッセージ部分の合計の高さ
        const messageHeight = estimatedMsgLines * (fontSize + 8);

        // 3. 全体の垂直方向のパディング
        // 元のコードで使われていた `+ 16` を全体のパディングとして適用
        const totalPadding = 16;

        // 合計の高さを返す
        return nameLineHeight + messageHeight + totalPadding;
    };

    // --- useSocketからsocket.idを取得し、itemDataに含める ---
    const { socketId, emitPositive, emitNegative } = useSocket();

    // ListのitemDataにfilteredChatMessagesを渡す
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <List
                ref={listRef}
                height={bottomHeight}
                itemCount={chatCount}
                itemSize={getItemSize}
                width="100%"
                itemData={{ chatMessages: filteredChatMessages, emitChatMessage, userSocketId: socketId, emitPositive, emitNegative }}
                itemKey={index => index}
                style={{
                    overflow: 'hidden',
                    textAlign: 'left',
                }}
            >
                {ChatRow}
            </List>
        </React.Suspense>
    );
};

export default ChatComments;