// File: my-react-app/src/DocRow.jsx

// TODO: ドキュメント編集・追加・並び替えのsocket通信・DB保存・他クライアント反映は未実装

import React, { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';

import useChatStore from './store/chatStore';
import useSocket from './store/useSocket';
import './Doc.css'; // Assuming you have a CSS file for styling

const DocRow = ({ data, index, style }) => {
    // data = { docMessages, userInfo, emitChatMessage, setShouldScroll }
    const { docMessages, userInfo, emitChatMessage, setShouldScroll, listRef } = data;
    const message = docMessages[index];

    // useChatStoreから必要な関数を取得
    const customAddMessage = useChatStore((state) => state.customAddMessage);
    const updateMessage = useChatStore((state) => state.updateMessage);

    // useSocketからemitDocAdd, emitDocEditを取得
    const { emitDocAdd, emitDocEdit } = useSocket();

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
        updateMessage(index, e.target.textContent.replace(/\r/g, ''));
        // --- socket通信 ---
        emitDocEdit && emitDocEdit({ index, newMsg: e.target.textContent.replace(/\r/g, ''), id: message?.id });
        setIsEditing(false);
        // 高さ再計算（react-window用）
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // 編集ボタン押下で編集モードに
    const handleEdit = () => {
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
    };

    // ＋ボタン押下で下に新規行を追加
    const handleAddBelow = () => {
        if (setShouldScroll) setShouldScroll(false); // 新規行追加時はスクロール抑制
        customAddMessage({
            nickname: message?.nickname || 'Unknown',
            msg: '',
            index: index, // orderではなくindexを渡す
        });
        // --- socket通信 ---
        emitDocAdd && emitDocAdd({ nickname: message?.nickname || 'Unknown', msg: '', index });
        setTimeout(() => {
            const element = document.getElementById(`dc-${index + 1}`);
            if (element) {
                element.focus();
                element.contentEditable = true;
            }
        }, 0);
    };

    // 編集中に内容が変わったときも高さ再計算
    const handleInput = () => {
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
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
                    className={`doc-comment-item list-item-container${snapshot.isDragging ? ' is-dragging' : ''}`}
                    style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                >
                    <span {...provided.dragHandleProps} className='maru' />
                    <div
                        id={`dc-${index}`}
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
                    {/* ホバー時のみ表示される編集ボタン（右端） */}
                    <button
                        className="edit-button p-1 ml-1 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded-full shadow-md border"
                        title="編集"
                        onClick={handleEdit}
                        tabIndex={-1}
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    {/* ホバー時のみ表示される＋ボタン（右端） */}
                    <button
                        className="add-button p-1 bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-200 rounded-full shadow-md border"
                        title="下に行を挿入"
                        onClick={handleAddBelow}
                        tabIndex={-1}
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                    </button>
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(DocRow);