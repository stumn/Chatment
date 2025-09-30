// File: client/src/DocRow.jsx

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

import usePostStore from '../store/postStore';
import useAppStore from '../store/appStore';

import useFadeOut from '../hooks/useFadeOut';
import useEditMode from '../hooks/useEditMode';
import ActionButtons from './ActionButtons';
import ChangeBar from './ChangeBar';
import '../styles/Doc.css';

const DocRow = ({ data, index, style }) => {

    // dataから必要な情報を抽出
    const { docMessages, userInfo, documentFunctions, setShouldScroll, listRef } = data;

    const message = docMessages[index];

    const {
        document: { add, edit, delete: deleteDoc, requestLock }, chat: sendChatMessage
    } = documentFunctions;

    // カスタムフックで編集モード管理
    const {
        isEditing,
        contentRef,
        startEdit,
        handleBlur,
        handleCompleteEdit,
        handleInput,
        handleKeyDown,
        editError,
        clearEditError
    } = useEditMode(message, userInfo, edit, listRef, index);

    // 行のElement IDを生成
    const rowElementId = `dc-${index}-${message?.displayOrder}-${message?.id}`;

    // この行がロックされているかチェック
    const locked = usePostStore.getState().isRowLocked(rowElementId);
    const lockInfo = usePostStore.getState().getRowLockInfo(rowElementId);

    // この行の変更状態を取得
    const changeState = usePostStore.getState().getChangeState(message?.id);

    // カスタムフックでフェードアウト管理
    const { isFadingOut, handleMouseEnter, handleMouseLeave } = useFadeOut(
        changeState,
        isEditing,
        message?.id
    );

    // 新規行追加
    const handleAddBelow = () => {
        if (setShouldScroll) setShouldScroll(false);
        const data = {
            nickname: userInfo.id || 'Undefined', // userInfo.nicknameも考慮
            msg: '',
            insertAfterId: message.id, // このメッセージの後に挿入したいという意図を伝える
            prevDisplayOrder: message.displayOrder, // ここでdisplayOrderを指定
            datafordebug: `${userInfo.nickname} + (${userInfo.status}+${userInfo.ageGroup})` || 'Undefined',
            spaceId: documentFunctions.spaceId, // spaceIdを追加
        };
        add && add(data);
    };

    // 編集ボタン押下で編集モードに
    const handleEdit = () => {

        // ロック中の場合は編集不可
        if (locked) {
            console.log('Row is locked by:', lockInfo?.nickname);
            return;
        }

        // カスタムフックの編集開始関数を使用
        startEdit(requestLock, rowElementId);

    };

    // 空白行判定
    const isBlank = !message?.msg || message.msg.trim() === '';

    // 見出し行判定（#で始まる行）
    const isHeading = message?.msg && message.msg.trim().startsWith('#');

    // リアクションによるハイライトスタイルの判定
    const getReactionHighlight = () => {

        // シンプルモードの場合はハイライトしない
        if (!useAppStore.getState().isColorfulMode) {
            return {};
        }

        const positive = message?.positive || 0;
        const negative = message?.negative || 0;

        // ポジティブ・ネガティブの差を計算
        const diff = positive - negative;

        if (diff === 0) {
            // 差がない場合は何もしない
            return {};
        }

        return diff > 0
            ? { backgroundColor: '#e6ffe6', padding: '2px 4px', borderRadius: '4px' }
            : { backgroundColor: '#ffe6e6', padding: '2px 4px', borderRadius: '4px' };
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

        // 削除時はスクロール抑制
        if (setShouldScroll) setShouldScroll(false);

        // 削除の変更状態を記録
        usePostStore.getState().setChangeState(message.id, 'deleted', userInfo?.nickname || 'Unknown');

        // serverに削除要求を送信
        deleteDoc && deleteDoc(message.id);

        // storeからも削除
        usePostStore.getState().removePost(message.id);

        // リストの再描画をトリガー
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
                    className={`doc-comment-item${snapshot.isDragging ? ' is-dragging' : ''}${locked ? ' locked' : ''}`}
                    style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                // ロック管理用のdata属性
                >
                    <ChangeBar
                        changeState={changeState}
                        isFadingOut={isFadingOut}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />

                    {/* 見出し行の場合は.dotを非表示 */}
                    {!isHeading && <span {...provided.dragHandleProps} className='dot' />}
                    <div
                        id={rowElementId}
                        className='doc-comment-content'
                        contentEditable={isEditing && !locked} // ロック中は編集不可
                        suppressContentEditableWarning={true}
                        ref={contentRef}
                        onBlur={handleBlur}
                        onInput={(e) => {
                            handleInput(e);
                            // 入力中にエラーをクリア
                            if (editError) {
                                clearEditError();
                            }
                        }}
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

                    {/* 編集エラーメッセージの表示 */}
                    {editError && isEditing && (
                        <div className="edit-error" style={{
                            position: 'absolute',
                            top: '100%',
                            left: '20px',
                            right: '20px',
                            backgroundColor: '#ffebee',
                            border: '1px solid #f44336',
                            borderRadius: '4px',
                            padding: '8px',
                            fontSize: '12px',
                            color: '#d32f2f',
                            zIndex: 1000,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            ⚠️ {editError}
                        </div>
                    )}

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