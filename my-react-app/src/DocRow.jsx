// File: my-react-app/src/DocRow.jsx

import React, { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';

import usePostStore from './store/postStore';
import './Doc.css'; // Assuming you have a CSS file for styling

const DocRow = ({ data, index, style }) => {
    // data = { docMessages, userInfo, emitChatMessage, setShouldScroll }
    const {
        docMessages,
        userInfo,
        emitChatMessage,
        emitDocAdd,
        emitDemandLock,
        emitDocEdit,
        emitDocDelete,
        setShouldScroll,
        listRef,
    } = data;
    const message = docMessages[index];

    const addDocMessage = usePostStore((state) => state.addPost);
    const updateDocMessage = usePostStore((state) => state.updatePost);
    const removeDocMessage = usePostStore((state) => state.removePost);

    // 編集状態を管理するためのステート
    const [isEditing, setIsEditing] = useState(false);

    // contentEditableの要素を参照するためのref
    const contentRef = useRef(null);

    // 新規行追加
    const handleAddBelow = () => {
        if (setShouldScroll) setShouldScroll(false);

        console.log('handleAddBelow displayOrder:', message.displayOrder);

        const data = {
            nickname: userInfo.id || 'Undefined', // userInfo.nicknameも考慮
            msg: '',
            insertAfterId: message.id, // このメッセージの後に挿入したいという意図を伝える
            displayOrder: message.displayOrder, // ここでdisplayOrderを指定
            datafordebug: `${userInfo.nickname} + (${userInfo.status}+${userInfo.ageGroup})` || 'Undefined',
        };

        console.log('handleAddBelow called for message:', data);

        // 新しい行を挿入したいメッセージのIDをサーバーに送信
        emitDocAdd && emitDocAdd(data);

        setIsEditing(false); // 新規行はサーバからのdoc-addで追加されるため、setTimeoutでのfocusは不要
    };

    // 編集終了
    const handleBlur = (e) => {
        updateDocMessage(message.id, e.target.textContent.replace(/\r/g, ''));
        emitDocEdit && emitDocEdit({ id: message.id, newMsg: e.target.textContent.replace(/\r/g, ''), nickname: userInfo.nickname });
        setIsEditing(false);
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    const askIsLocked = () => {
        console.log('askIsLocked called for message:', message);
        const data = {
            // `dc-${index}-${message?.displayOrder}-${message?.id}`
            rowElementId: `dc-${index}-${message?.displayOrder}-${message?.id}`,
            nickname: message.nickname || userInfo.nickname, // nicknameを渡す
        };
        emitDemandLock(data);
    };

    const handleEdit = () => {
        if (isPermitted) {
            setIsEditing(true);
            setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.focus();

                    // キャレットを末尾に
                    const range = document.createRange();
                    range.selectNodeContents(contentRef.current);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }, 0);
        } else {
            alert('編集できません');
        };
    };

    // 編集中に内容が変わったときも高さ再計算
    const handleInput = () => {
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // 空白行判定
    const isBlank = !message?.msg || message.msg.trim() === '';

    // 行削除
    const handleDelete = () => {
        if (setShouldScroll) setShouldScroll(false); // 削除時はスクロール抑制
        emitDocDelete && emitDocDelete(message.id);
        removeDocMessage(message.id);
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // アイコンをコンポーネントとして定義
    const EditIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
    );
    const DeleteIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" /><path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
    );
    const AddIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
    );

    return (
        // --- draggableIdにindexではなくmessage.idを使うことでDnDの安定性向上 ---
        <Draggable draggableId={String(message?.id ?? index)} index={index} key={message?.id ?? index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`doc-comment-item list-item-container${snapshot.isDragging ? ' is-dragging' : ''}`}
                    style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                >
                    <span {...provided.dragHandleProps} className='maru' />
                    <div
                        id={`dc-${index}-${message?.displayOrder}-${message?.id}`}
                        className='doc-comment-content'
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        ref={contentRef}
                        onBlur={handleBlur}
                        onInput={handleInput}
                        tabIndex={0}
                        spellCheck={true}
                    >
                        {(message?.msg || '').split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* ホバー時のみ表示される編集・削除・追加ボタン（右端に横並び） */}
                    <button
                        className="edit-button p-1 ml-1 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded-full shadow-md border"
                        title="編集"
                        onClick={askIsLocked}
                        tabIndex={-1}
                        type="button"
                    >
                        <EditIcon />
                    </button>
                    {isBlank && (
                        <button
                            className="delete-button p-1 ml-1 bg-white text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-full shadow-md border"
                            title="空白行を削除"
                            onClick={handleDelete}
                            tabIndex={-1}
                            type="button"
                        >
                            <DeleteIcon />
                        </button>
                    )}
                    <button
                        className="add-button p-1 bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-200 rounded-full shadow-md border"
                        title="下に行を挿入"
                        onClick={handleAddBelow}
                        tabIndex={-1}
                        type="button"
                    >
                        <AddIcon />
                    </button>
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(DocRow);