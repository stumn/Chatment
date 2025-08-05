// File: my-react-app/src/DocRow.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import Tooltip from '@mui/material/Tooltip';

import usePostStore from './store/postStore';
import useAppStore from './store/appStore';
import useFadeOut from './hooks/useFadeOut';
import ActionButtons from './components/ActionButtons';
import ChangeBar from './components/ChangeBar';
import './Doc.css';

const DocRow = ({ data, index, style }) => {
    const { docMessages, userInfo, documentFunctions, setShouldScroll, listRef } = data;
    const message = docMessages[index];

    const addDocMessage = usePostStore((state) => state.addPost);
    const updateDocMessage = usePostStore((state) => state.updatePost);
    const removeDocMessage = usePostStore((state) => state.removePost);

    const isRowLocked = usePostStore((state) => state.isRowLocked);
    const getRowLockInfo = usePostStore((state) => state.getRowLockInfo);

    const getChangeState = usePostStore((state) => state.getChangeState);
    const setChangeState = usePostStore((state) => state.setChangeState);
    const clearChangeState = usePostStore((state) => state.clearChangeState);

    // カラフルモードの状態を取得
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);

    const {
        document: { add, edit, delete: deleteDoc, requestLock }, chat: sendChatMessage
    } = documentFunctions;

    // 編集状態を管理するためのステート
    const [isEditing, setIsEditing] = useState(false);

    // contentEditableの要素を参照するためのref
    const contentRef = useRef(null);

    // 行のElement IDを生成
    const rowElementId = `dc-${index}-${message?.displayOrder}-${message?.id}`;

    // この行がロックされているかチェック
    const locked = isRowLocked(rowElementId);
    const lockInfo = getRowLockInfo(rowElementId);

    // この行の変更状態を取得
    const changeState = getChangeState(message?.id);

    // カスタムフックでフェードアウト管理
    const { isFadingOut, handleMouseEnter, handleMouseLeave } = useFadeOut(
        changeState,
        isEditing,
        message?.id,
        clearChangeState
    );

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
        add && add(data);

        setIsEditing(false); // 新規行はサーバからのdoc-addで追加されるため、setTimeoutでのfocusは不要
    };

    // 編集終了
    const handleBlur = (e) => {
        const newContent = e.target.textContent.replace(/\r/g, '');
        const originalContent = message.msg || '';

        updateDocMessage(message.id, newContent);
        edit && edit(message.id, newContent);

        // 内容が実際に変更された場合のみ変更状態を記録
        if (newContent !== originalContent) {
            setChangeState(message.id, 'modified', userInfo?.nickname || 'Unknown');
        }

        setIsEditing(false);
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // 編集ボタン押下で編集モードに
    const handleEdit = () => {
        // ロック中の場合は編集不可
        if (locked) {
            console.log('Row is locked by:', lockInfo?.nickname);
            return;
        }

        // ロック要求を送信
        requestLock && requestLock(rowElementId, userInfo?.nickname, userInfo?._id);

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

    // 編集中に内容が変わったときも高さ再計算
    const handleInput = () => {
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // Ctrl+Enterで編集完了
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && isEditing) {
            e.preventDefault(); // デフォルトの改行動作を防ぐ
            handleCompleteEdit();
        }
    };

    // 編集完了ボタンのハンドラー
    const handleCompleteEdit = () => {
        if (contentRef.current) {
            // handleBlurと同じロジックを実行
            const newContent = contentRef.current.textContent.replace(/\r/g, '');
            const originalContent = message.msg || '';
            
            updateDocMessage(message.id, newContent);
            edit && edit(message.id, newContent);

            // 内容が実際に変更された場合のみ変更状態を記録
            if (newContent !== originalContent) {
                setChangeState(message.id, 'modified', userInfo?.nickname || 'Unknown');
            }
            
            setIsEditing(false);
            if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
                listRef.current.resetAfterIndex(index, true);
            }
        }
    };

    // 空白行判定
    const isBlank = !message?.msg || message.msg.trim() === '';

    // 見出し行判定（#で始まる行）
    const isHeading = message?.msg && message.msg.trim().startsWith('#');

    // リアクションによるハイライトスタイルの判定
    const getReactionHighlight = () => {
        // シンプルモードの場合はハイライトしない
        if (!isColorfulMode) {
            return {};
        }

        const positive = message?.positive || 0;
        const negative = message?.negative || 0;

        // ポジティブ・ネガティブの差を計算
        const diff = positive - negative;

        if (diff > 0) {
            // ポジティブが優勢
            return {
                backgroundColor: '#e6ffe6', // 薄い緑色
                padding: '2px 4px',
                borderRadius: '4px'
            };
        } else if (diff < 0) {
            // ネガティブが優勢
            return {
                backgroundColor: '#ffe6e6', // 薄い赤色
                padding: '2px 4px',
                borderRadius: '4px'
            };
        }

        // 差がない場合は何もしない
        return {};
    };

    // 見出しスタイルと通常スタイルを統合
    const getContentStyle = () => {
        const baseStyle = !isBlank ? getReactionHighlight() : {};
        
        if (isHeading) {
            return {
                ...baseStyle,
                fontSize: '1.5em',
                fontWeight: 'bold'
            };
        }
        
        return baseStyle;
    };

    // 行削除
    const handleDelete = () => {
        if (setShouldScroll) setShouldScroll(false); // 削除時はスクロール抑制

        // 削除の変更状態を記録
        setChangeState(message.id, 'deleted', userInfo?.nickname || 'Unknown');

        deleteDoc && deleteDoc(message.id);
        removeDocMessage(message.id);
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    return (
        // --- draggableIdにindexではなくmessage.idを使うことでDnDの安定性向上 ---
        <Draggable
            draggableId={String(message?.id ?? index)}
            index={index}
            key={message?.id ?? index}
            isDragDisabled={locked} // ロック中はドラッグ無効化
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`doc-comment-item list-item-container${snapshot.isDragging ? ' is-dragging' : ''}${locked ? ' locked' : ''}`}
                    style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                // ロック管理用のdata属性
                >
                    <ChangeBar
                        changeState={changeState}
                        isFadingOut={isFadingOut}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />

                    <span {...provided.dragHandleProps} className='dot' />
                    <div
                        id={rowElementId}
                        className='doc-comment-content'
                        contentEditable={isEditing && !locked} // ロック中は編集不可
                        suppressContentEditableWarning={true}
                        ref={contentRef}
                        onBlur={handleBlur}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown} // Ctrl+Enter対応
                        tabIndex={0}
                        spellCheck={true}
                        style={getContentStyle()} // 見出しスタイルとハイライトを統合
                    >
                        {(message?.msg || '').split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* ロック中は操作ボタンを非表示 */}
                    {!locked && (
                        <ActionButtons
                            isEditing={isEditing}
                            isBlank={isBlank}
                            onEdit={handleEdit}
                            onCompleteEdit={handleCompleteEdit}
                            onDelete={handleDelete}
                            onAddBelow={handleAddBelow}
                        />
                    )}

                    {locked && (
                        <div className="lock-info" style={{
                            position: 'absolute',
                            top: '2px',
                            right: '8px',
                            fontSize: '11px',
                            color: '#856404'
                        }}>
                            🔒他のユーザが編集中です
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(DocRow);