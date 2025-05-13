import React, { useState, useEffect, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み

const ChatComments = ({ lines, bottomHeight }) => {
    const MALTIPILER = 1.1; // フォントサイズの倍率
    const FONT_SIZE = 15; // 基本フォントサイズ

    const listRef = React.createRef(); // Listコンポーネントに使うref
    const messages = useChatStore((state) => state.messages);

    const chatMessages = useMemo(() => {
        if (!messages || messages.length === 0) return;
        return lines.num < 1.5
            ? [messages[messages.length - 1]] // ← 1つだけど配列にしておく
            : messages.slice(-Math.ceil(lines.num)); // ← 少数を切り上げて取得
    }, [lines.num, messages]);

    // スクロールを最下部に
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(chatMessages.length - 1, 'end');
        }
    }, [chatMessages]);

    const getItemSize = (index) => {
        const lineHeight = 24;
        const charCount = chatMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / 30); // TODO: 幅による調整が必要なら実装検討
        return estimatedLines * lineHeight + 16;
    };

    return (
        <List
            ref={listRef}
            height={bottomHeight}
            itemCount={chatMessages.length}
            itemSize={getItemSize}
            width="100%"
            itemData={{ chatMessages, FONT_SIZE, MALTIPILER }}
            style={{
                overflow: 'hidden',
                textAlign: 'left',
            }}
        >
            {ChatRow}
        </List>
    );
};

export default ChatComments;