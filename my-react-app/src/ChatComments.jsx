import React, { useEffect, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み

const ChatComments = ({ lines, bottomHeight, emitChatMessage }) => {

    const listRef = React.createRef(); // Listコンポーネントに使うref
    const messages = useChatStore((state) => state.messages);

    const chatMessages = useMemo(() => {
        if (!messages || messages.length === 0) {
            return [];
        }
        const result = lines.num < 1.5
            ? [messages[messages.length - 1]] // 1つだけど配列にしておく
            : messages.slice(-Math.ceil(lines.num)); // 少数を切り上げて取得
        return result;
    }, [lines.num, messages]);

    const chatCount = chatMessages.length;

    // スクロールを最下部に
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(chatMessages.length - 1, 'end');
        }
    }, [chatMessages]);

    const getItemSize = (index) => {
        const lineHeight = 24;
        if (!chatMessages || !chatMessages[index] || !chatMessages[index].msg) {
            return lineHeight + 16;
        }
        const charCount = chatMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / 30); // TODO: 幅による調整が必要なら実装検討
        return estimatedLines * lineHeight + 16;
    };

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <List
                ref={listRef}
                height={bottomHeight}
                itemCount={chatCount}
                itemSize={getItemSize}
                width="100%"
                itemData={{chatMessages, emitChatMessage}}
                itemKey={index => chatMessages[index]?.id ?? index} // ここを追加
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