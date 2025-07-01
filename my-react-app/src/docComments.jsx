// // File: my-react-app/src/docComments.jsx

import React, { useEffect, useRef, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css';
import DocRow from './DocRow'; // ←遅延読み込みをやめて通常import

import useChatStore from './store/chatStore';
import useSizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

const DocComments = ({ lines, emitChatMessage }) => {
    const listRef = useRef(null);

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

    // スクロールを最下部に
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, 'end');
        }
    }, [myHeight, lines.num, docMessages.length]);

    // 各行の高さを計算
    const getItemSize = (index) => {
        const lineHeight = 28;
        if (!docMessages[index] || !docMessages[index].msg) return lineHeight + 16;
        const charCount = docMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / charsPerLine) || 1;
        return estimatedLines * lineHeight;
    };

    // DnDのonDragEnd
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        reorderMessages(source.index, destination.index);
    };

    // Listに渡すitemData
    const itemData = useMemo(() => ({
        docMessages,
        userInfo,
        emitChatMessage,
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
