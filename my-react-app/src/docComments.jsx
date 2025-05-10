import React from 'react';
import { VariableSizeList as List } from 'react-window';
import useChatStore from './store/chatStore';
import { useEffect, useState } from 'react';

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Row from './Row';

const DocComments = ({ myHeight, lines }) => {
    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    const [docMessages, setDocMessages] = useState([]);
    useEffect(() => {
        setDocMessages(messages.slice(0, Math.max(0, messages.length - lines)));
    }, [messages, lines]);

    // アイテムの高さを動的に計算する関数
    const getItemSize = (index) => {
        if (!docMessages || !docMessages[index]) {
            return 30; // メッセージがない場合のデフォルト高さ
        }

        const lineHeight = 24; // 1行の高さ
        const charCount = docMessages[index].msg.length; // msgプロパティを使用
        const estimatedLines = Math.ceil(charCount / 40); // 1行40文字 ★この文字数を、width に合わせて調整したい
        return estimatedLines * lineHeight + 16; // paddingを加算
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
                        height={myHeight}
                        itemCount={docMessages ? docMessages.length : 0} // docMessagesが存在する場合のみitemCountを設定
                        itemSize={getItemSize} // 高さを動的に設定
                        width="100%"
                        outerRef={provided.innerRef}
                        itemData={{ docMessages, updateMessage }}
                        style={{ overflowX: 'hidden' }} // スクロールを有効にする
                    >
                        {Row}
                    </List>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DocComments;
