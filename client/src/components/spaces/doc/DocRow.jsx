// File: client/src/DocRow.jsx

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

import usePostStore from '../../../store/spaces/postStore';
import useAppStore from '../../../store/spaces/appStore';

import useFadeOut from '../../../hooks/spaces/useFadeOut';
import useEditMode from '../../../hooks/spaces/useEditMode';
import ActionButtons from './ActionButtons';
import ChangeBar from './ChangeBar';
import { linkifyText } from '../../../utils/linkify';
import './Doc.css';

const DocRow = ({ data, index, style }) => {

    // dataから必要な情報を抽出
    const { docMessages, userInfo, documentFunctions, listRef } = data;

    const message = docMessages[index];

    const {
        document: { add, edit, delete: deleteDoc, requestLock }, chat: sendChatMessage
    } = documentFunctions;

    // 行のElement IDを生成（useEditModeより前に定義する必要がある）
    const rowElementId = `dc-${index}-${message?.displayOrder}-${message?.id}`;

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
    } = useEditMode(message, userInfo, edit, listRef, index, documentFunctions.document.unlockRow, rowElementId, deleteDoc, documentFunctions.emitLog);

    // この行がロックされているかチェック（Zustandで購読して再レンダリングを有効化）
    const locked = usePostStore((state) => state.isRowLocked(rowElementId));
    const lockInfo = usePostStore((state) => state.getRowLockInfo(rowElementId));

    // 自分以外がロックしている場合のみ編集不可にする
    const lockedByOthers = locked && lockInfo?.nickname !== userInfo?.nickname;

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
        // 親行のインデントレベルより1段深くする（最大2まで）
        const newIndentLevel = Math.min((message.indentLevel || 0) + 1, 2);

        const data = {
            nickname: userInfo.id || 'Undefined', // userInfo.nicknameも考慮
            msg: '',
            insertAfterId: message.id, // このメッセージの後に挿入したいという意図を伝える
            prevDisplayOrder: message.displayOrder, // ここでdisplayOrderを指定
            indentLevel: newIndentLevel, // インデントレベルを追加
            datafordebug: `${userInfo.nickname} + (${userInfo.status}+${userInfo.ageGroup})` || 'Undefined',
            spaceId: documentFunctions.spaceId, // spaceIdを追加
        };
        add && add(data);
    };

    // 編集ボタン押下で編集モードに
    const handleEdit = async () => {

        // 他のユーザーがロック中の場合は編集不可
        if (lockedByOthers) {
            return;
        }

        // 既に自分がロックしている場合は、ロック要求なしで編集開始
        const lockedByMe = locked && lockInfo?.nickname === userInfo?.nickname;

        if (lockedByMe) {
            // ロック要求をスキップして編集開始
            await startEdit(null, rowElementId);
        } else {
            // ロック要求を送信してから編集開始（応答を待つ）
            await startEdit(requestLock, rowElementId);
        }
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

        // 削除の変更状態を記録
        usePostStore.getState().setChangeState(message.id, 'deleted', userInfo?.nickname || 'Unknown');

        // serverに削除要求を送信（削除ボタンからの削除であることを明示）
        deleteDoc && deleteDoc(message.id, 'manual');

        // storeからも削除
        usePostStore.getState().removePost(message.id);

        // リストの再描画をトリガー
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    // インデント変更処理
    const handleIndentChange = (delta) => {
        console.log('handleIndentChange', delta);

        const currentIndent = message.indentLevel || 0;
        console.log('currentIndent', currentIndent);

        const newIndent = Math.min(Math.max(currentIndent + delta, 0), 2);
        console.log('newIndent', newIndent);

        console.log(message.id);
        if (newIndent !== currentIndent) {
            console.log(newIndent !== currentIndent);
            if (documentFunctions.document.changeIndent) {
                console.log(documentFunctions.document.changeIndent);
                documentFunctions.document.changeIndent(message.id, newIndent);

                // インデント変更後にリストの高さを再計算
                if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
                    setTimeout(() => {
                        listRef.current.resetAfterIndex(0, true);
                    }, 0);
                }
            }
        };
    }

    return (
        // --- draggableIdにindexではなくmessage.idを使うことでDnDの安定性向上 ---
        <Draggable
            draggableId={String(message?.id ?? index)}
            index={index}
            key={message?.id ?? index}
            isDragDisabled={lockedByOthers} // 他のユーザーがロック中はドラッグ無効化
        >
            {(provided, snapshot) => {
                // コンパクトモードの状態を取得
                const isCompactMode = useAppStore.getState().isCompactMode;
                const currentIndent = message?.indentLevel || 0;

                return (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`doc-comment-item group${snapshot.isDragging ? ' is-dragging' : ''}${lockedByOthers ? ' locked' : ''}${isCompactMode ? ' compact-mode' : ''} indent-level-${currentIndent}`}
                        style={style ? { ...provided.draggableProps.style, ...style } : provided.draggableProps.style}
                    // ロック管理用のdata属性
                    >
                        <ChangeBar
                            changeState={changeState}
                            isFadingOut={isFadingOut}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />

                        {/* インデントボタン（見出し以外） */}
                        {!isHeading && !lockedByOthers && (
                            <div className="indent-buttons">
                                {currentIndent === 2 ? (
                                    <button
                                        className="indent-button indent-decrease-double"
                                        onClick={() => handleIndentChange(-2)}
                                        title="インデントを戻す"
                                    >
                                        ≪
                                    </button>
                                ) : (
                                    <button
                                        className="indent-button indent-increase"
                                        onClick={() => handleIndentChange(1)}
                                        title="インデントする"
                                    >
                                        ＞
                                    </button>
                                )}
                            </div>
                        )}

                        <div
                            id={rowElementId}
                            className='doc-comment-content'
                            contentEditable={isEditing && !lockedByOthers} // 他のユーザーがロック中は編集不可
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
                            {isEditing ? (
                                // 編集中は通常のテキストを表示
                                (message?.msg || '').split('\n').map((line, i, arr) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < arr.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                            ) : (
                                // 表示中はURLをリンクに変換
                                (message?.msg || '').split('\n').map((line, i, arr) => (
                                    <React.Fragment key={i}>
                                        {linkifyText(line)}
                                        {i < arr.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                            )}
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

                        {/* リアクション数の表示（テキストとボタンの間に配置） */}
                        {!isBlank && (message?.positive > 0 || message?.negative > 0) && (
                            <div className="reaction-display" style={{
                                display: 'inline-flex',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#666',
                                marginLeft: '8px',
                                marginRight: '4px',
                                verticalAlign: 'middle'
                            }}>
                                {message.positive > 0 && (
                                    <span style={{ color: '#2e7d32' }}>↑{message.positive}</span>
                                )}
                                {message.negative > 0 && (
                                    <span style={{ color: '#c62828' }}>↓{message.negative}</span>
                                )}
                            </div>
                        )}

                        {/* 他のユーザーがロック中は操作ボタンを非表示 */}
                        {!lockedByOthers && (
                            <ActionButtons
                                isEditing={isEditing}
                                isBlank={isBlank}
                                onEdit={handleEdit}
                                onCompleteEdit={handleCompleteEdit}
                                onDelete={handleDelete}
                                onAddBelow={handleAddBelow}
                            />
                        )}

                        {lockedByOthers && (
                            <div className="lock-info" style={{
                                position: 'absolute',
                                top: '2px',
                                right: '8px',
                                fontSize: '11px',
                                color: '#856404'
                            }}>
                                🔒{lockInfo?.nickname}が編集中です
                            </div>
                        )}
                    </div>
                );
            }}
        </Draggable>
    );
};

export default React.memo(DocRow);