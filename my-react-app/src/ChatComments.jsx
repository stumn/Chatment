import React, { useState, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み

const ChatComments = ({ lines, bottomHeight }) => {
    const MALTIPILER = 1.1; // フォントサイズの倍率
    const FONT_SIZE = 16; // 基本フォントサイズ

    const listRef = React.createRef(); // Listコンポーネントに使うref
    const messages = useChatStore((state) => state.messages);
    const [chatMessages, setChatMessages] = useState([]);

    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const recentMessages =
            lines.num < 1.5
                ? [messages[messages.length - 1]] // ← 配列にしておく
                : messages.slice(-Math.ceil(lines.num)); // ← 小数対応

        setChatMessages(recentMessages);

        console.log('Chat Messages:', recentMessages);
        console.log('Lines:', lines);
    }, [bottomHeight, lines, messages]);

    // スクロールを最下部に
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(chatMessages.length - 1, 'end');
        }
    }, [chatMessages]);

    const getItemSize = (index) => {
        console.log('getItemSize:', index, chatMessages[index]);
        if (!chatMessages || !chatMessages[index]) {
            console.log('No chat message found, 68px returned');
            return 68;
        }

        const lineHeight = 24;
        const charCount = chatMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / 30); // TODO: 幅による調整が必要なら実装検討
        console.log('estimatedLines:', estimatedLines);
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