import React, { useEffect, useState, useRef, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';
import useSizeStore from './store/sizeStore';
import './Doc.css'; // Assuming you have a CSS file for styling

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
const DocRow = React.lazy(() => import('./DocRow')); // DocRowを遅延読み込み

const DocComments = ({ myHeight, lines, isName }) => {

    const listRef = useRef(null);  // ← Listコンポーネントに使うref

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    const docMessages = useMemo(() => {
        if (!messages || messages.length === 0) {
            return [];
        }
        return messages.slice(0, Math.max(0, messages.length - lines.num));
    }, [messages, lines.num]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, "end"); // ← 最下部にスクロール
        }
    }, [myHeight, lines.num, docMessages.length]);

    // Listの幅を取得 幅 * 0.8 を切り捨て
    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8); // 80%の幅を使用

    // 幅に基づいて1行あたりの文字数を計算（800に対して60文字になるよう、仮に1文字あたり13pxと仮定）
    const charsPerLine = Math.floor(listWidth / 13);

    const getItemSize = (index) => {
        const lineHeight = 28; // 1行あたりの高さを28pxに設定
        if (!docMessages || !docMessages[index] || !docMessages[index].msg) {
            return lineHeight + 16;
        }
        const charCount = docMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / charsPerLine); // 計算した文字数で行数を計算
        return estimatedLines * lineHeight; // 必要な行数分の高さを返す
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        reorderMessages(source.index, destination.index);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
                droppableId="droppable"
                mode="virtual"
                renderClone={(provided, snapshot, rubric) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={provided.draggableProps.style}
                    >
                        {docMessages[rubric.source.index] ? docMessages[rubric.source.index].msg : ''}
                    </div>
                )}
            >
                {(provided) => (
                    <List
                        id="docList"
                        ref={listRef}  // ← ここでListにrefを適用
                        height={myHeight}
                        itemCount={docMessages.length}
                        itemSize={getItemSize}
                        width="100%"
                        outerRef={provided.innerRef}
                        itemData={{docMessages, isName}}
                    >
                        {DocRow}
                    </List>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DocComments;
