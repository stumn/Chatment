import React, { useEffect, useState, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import DocRow from './DocRow';

const DocComments = ({ myHeight, lines }) => {

    const listRef = useRef(null);  // ← Listコンポーネントに使うref

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    const [docMessages, setDocMessages] = useState([]);
    useEffect(() => {
        setDocMessages(messages.slice(0, Math.max(0, messages.length - lines.num)));
    }, [messages, lines.num]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, "end"); // ← 最下部にスクロール
        }
    }, [myHeight, lines.num, docMessages.length]);

    const getItemSize = (index) => {
        if (!docMessages || !docMessages[index]) {
            return 30;
        }

        const lineHeight = 24;
        const charCount = docMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / 40); // TODO: 幅による調整が必要なら実装検討
        return estimatedLines * lineHeight + 16;
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
                        className='doc-comment'
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
                        ref={listRef}  // ← ここでListにrefを適用
                        height={myHeight}
                        itemCount={docMessages.length}
                        itemSize={getItemSize}
                        width="100%"
                        outerRef={provided.innerRef}
                        itemData={{ docMessages, updateMessage }}
                        style={{ overflowX: 'hidden' }}
                    >
                        {DocRow}
                    </List>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DocComments;
