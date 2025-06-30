// ChatComments.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';

import useChatStore from './store/chatStore';
const ChatRow = React.lazy(() => import('./ChatRow')); // DocRowを遅延読み込み

const ChatComments = ({ lines, bottomHeight, emitChatMessage }) => {

    const listRef = useRef(null);
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
        const cMsg = chatMessages[index];

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

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <List
                ref={listRef}
                height={bottomHeight}
                itemCount={chatCount}
                itemSize={getItemSize}
                width="100%"
                itemData={{ chatMessages, emitChatMessage }}
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