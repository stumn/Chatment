// // File: my-react-app/src/docComments.jsx

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css';
import DocRow from './DocRow'; // ←遅延読み込みをやめて通常import

import useChatStore from './store/chatStore';
import useSizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

const DocComments = ({ lines, emitChatMessage }) => {
    const listRef = useRef(null);
    // --- 新規行追加時の自動スクロール抑制用 ---
    const [shouldScroll, setShouldScroll] = useState(true);

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    const { userInfo, myHeight } = useAppStore();

    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8);
    const charsPerLine = Math.floor(listWidth / 13);

    // 表示するdocMessagesを決定
    const docMessages = useMemo(() => {
        if (!messages || messages.length === 0) {
            return [];
        }
        return messages.slice(0, Math.max(0, messages.length - lines.num));
    }, [messages, lines.num]);

    // スクロールを最下部に（shouldScrollがtrueのときのみ）
    useEffect(() => {
        if (shouldScroll && listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, 'end');
        }
    }, [myHeight, lines.num, docMessages.length, shouldScroll]);

    // 各行の高さを計算（改行や長文も考慮）
    const getItemSize = (index) => {
        const lineHeight = 28;
        if (!docMessages[index] || !docMessages[index].msg) return lineHeight + 16;
        // 改行数をカウント
        const msg = docMessages[index].msg;
        const lines = msg.split('\n').length;
        // 1行ごとの文字数で折り返し行数を推定
        const charCount = msg.length;
        const charsPerLine = Math.floor(listWidth / 13);
        const estimatedLines = Math.max(
            lines,
            ...msg.split('\n').map(line => Math.ceil(line.length / charsPerLine) || 1)
        );
        return estimatedLines * lineHeight + 8;
    };

    // DnDのonDragEnd
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        reorderMessages(source.index, destination.index);
        // 並び替え後に高さキャッシュをリセット（全アイテム再計算）
        if (listRef.current) {
            listRef.current.resetAfterIndex(0, true); // trueで全て再計算
        }
    };

    // Listに渡すitemData
    const itemData = useMemo(() => ({
        docMessages,
        userInfo,
        emitChatMessage,
        setShouldScroll, // 追加: DocRowから呼べるように
        listRef, // 追加: DocRowから高さ再計算用に参照
    }), [docMessages, userInfo, emitChatMessage]);

    // ListのitemRenderer
    const renderRow = ({ index, style, data }) => (
        <DocRow
            data={data}
            index={index}
            style={style}
        />
    );

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
                droppableId="droppable"
                mode="virtual"
                direction="vertical"
                renderClone={(provided, snapshot, rubric) => (
                    // ドラッグ中のアイテムのクローン
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className='is-dragging'
                    >
                        <DocRow
                            data={itemData}
                            index={rubric.source.index}
                            style={provided.draggableProps.style}
                        />
                    </div>
                )}
            >
                {(provided) => (
                    <div style={{ width: '100%' }}>
                        <List
                            id="docList"
                            ref={listRef}
                            height={myHeight}
                            itemCount={docMessages.length}
                            itemSize={getItemSize}
                            outerRef={provided.innerRef}
                            itemData={itemData}
                        >
                            {renderRow}
                        </List>
                        {/* DnDのためのplaceholderを必ず描画 */}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DocComments;
