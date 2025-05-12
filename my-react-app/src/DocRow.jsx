import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const DocRow = ({ data, index, style }) => {
    const message = data.docMessages[index];
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
                            paddingLeft: isEditing ? 0 : '8px',
                        }}
                    >
                        {message?.msg || ''}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default DocRow;