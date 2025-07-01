// File: my-react-app/src/DocRow.jsx

import React, { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';

import useChatStore from './store/chatStore';
import './Doc.css'; // Assuming you have a CSS file for styling

const DocRow = ({ data, index, style }) => {
    // data = { docMessages, userInfo, emitChatMessage }
    const { docMessages, userInfo, emitChatMessage } = data;
    const message = docMessages[index];

    // useChatStoreから必要な関数を取得
    const customAddMessage = useChatStore((state) => state.customAddMessage);
    const updateMessage = useChatStore((state) => state.updateMessage);

    // 編集状態を管理するためのステート
    const [isEditing, setIsEditing] = useState(false);

    // contentEditableの要素を参照するためのref
    const contentRef = useRef(null);

    // 編集開始
    const handleFocus = () => {
        setIsEditing(true);

        // キャレットを末尾に
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    };

    // 編集終了
    const handleBlur = (e) => {
        updateMessage(index, e.target.textContent);
        setIsEditing(false);
    };

    // キーハンドリング
    const handleKeyDown = (e) => {
        if (!isEditing) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault(); // Enterキーで改行を防ぐ

                // 下に1行追加
                customAddMessage({
                    nickname: message?.nickname || 'Unknown', // customAddMessageの引数名をnicknameに修正
                    msg: '',
                    order: message?.order + 1 || 1,
                });

                // 新しく追加した行にフォーカスを移動
                setTimeout(() => {
                    const element = document.getElementById(`dc-${index + 1}`);
                    if (element) {
                        element.focus();
                        element.contentEditable = true; // 新しい行を編集可能にする
                    }
                }, 0);

                break;

            case 'Tab':
            case ' ':
            case 'Spacebar':
            case 'NumpadSpace':
            case 'Process':
            case '　': // 全角スペースキー（日本語入力時など）
                if (contentRef.current.textContent === '') {
                    e.preventDefault(); // スペースキーでのデフォルト動作を防ぐ
                    contentRef.current.textContent += '●';
                }

                // キャレットを末尾に
                const range = document.createRange();
                range.selectNodeContents(contentRef.current);
                range.collapse(false);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (index + 1 < docMessages.length) {
                    const nextElement = document.getElementById(`dc-${index + 1}`);
                    if (nextElement) {
                        nextElement.focus();
                        nextElement.contentEditable = true; // 次の行を編集可能にする
                    }
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (index - 1 >= 0) {
                    const prevElement = document.getElementById(`dc-${index - 1}`);
                    if (prevElement) {
                        prevElement.focus();
                        prevElement.contentEditable = true; // 前の行を編集可能にする
                    }
                }
                break;

            case 'Escape':
                handleBlur(e);
                break;
            default:
                break;
        }
    };

    return (
        // --- draggableIdにindexではなくmessage.idを使うことでDnDの安定性向上 ---
        <Draggable draggableId={String(message?.id ?? index)} index={index} key={message?.id ?? index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`doc-comment-item${snapshot.isDragging ? ' is-dragging' : ''}`}
                    style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                >
                    <span {...provided.dragHandleProps} className='maru' />
                    <div
                        id={`dc-${index}`}
                        className='doc-comment-content'
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        ref={contentRef}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        {message?.msg || ''}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(DocRow);