import React from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useChatStore from './store/chatStore';

const Row = ({ data, index, style }) => {
    const message = data.messages[index];
    const [isEditing, setIsEditing] = React.useState(false);
    const contentRef = React.useRef(null);

    const handleBlur = (e) => {
        data.updateMessage(index, e.target.textContent);
        setIsEditing(false);
    };

    return (
        <Draggable draggableId={String(index)} index={index} key={index}>
            {(provided) => (
                <div
                    className='doc-comment-item'
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...style,
                        ...provided.draggableProps.style,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 16px',
                        boxSizing: 'border-box',
                    }}
                    onDoubleClick={() => setIsEditing(true)}
                >
                    {/* ドラッグハンドルはここだけ */}
                    {!isEditing && (
                        <span {...provided.dragHandleProps}
                            style={{
                                marginRight: 8,
                                cursor: 'grab',
                                userSelect: 'none'
                            }}>
                            ≡
                        </span>
                    )}

                    {/* 編集可能領域 */}
                    <div
                        className='doc-comment-content'
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        ref={contentRef}
                        style={{
                            flex: 1,
                            outline: isEditing ? '1px solid #ccc' : 'none',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            cursor: isEditing ? 'text' : 'default',
                            textAlign: 'left',
                            paddingLeft: isEditing? 0: '8px',
                        }}
                    >
                        {message?.msg || ''}
                    </div>
                </div>
            )}
        </Draggable>
    );
};


const DocComments = ({ myHeight }) => {
    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    // アイテムの高さを動的に計算する関数
    const getItemSize = (index) => {
        if (!messages || !messages[index]) {
            return 30; // メッセージがない場合のデフォルト高さ
        }

        const lineHeight = 24; // 1行の高さ
        const charCount = messages[index].msg.length; // msgプロパティを使用
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
                        {messages[rubric.source.index] ? messages[rubric.source.index].msg : ''}
                    </div>
                )}
            >
                {(provided) => (
                    <List
                        height={myHeight}
                        itemCount={messages ? messages.length : 0} // messagesが存在する場合のみitemCountを設定
                        itemSize={getItemSize} // 高さを動的に設定
                        width="100%"
                        outerRef={provided.innerRef}
                        itemData={{ messages, updateMessage }}
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
