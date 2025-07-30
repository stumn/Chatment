// File: my-react-app/src/DocRow.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';

// ❌ 問題: useSocketを直接インポートすると、propsで受け取ったemitFunctionsと重複してsocket接続が複数作られる可能性があります
// import useSocket from './hooks/useSocket'; // 削除：propsからemitFunctionsを使用する
import usePostStore from './store/postStore';
import useAppStore from './store/appStore';
import './Doc.css'; // Assuming you have a CSS file for styling

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
    
    // フェードアウト状態の管理
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const fadeTimeoutRef = useRef(null);
    
    // 変更状態が変わったときのフェードアウトタイマー設定
    useEffect(() => {
        if (changeState && !isFadingOut) {
            // 既存のタイマーをクリア
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
            }
            
            // 5秒後にフェードアウト開始
            fadeTimeoutRef.current = setTimeout(() => {
                if (!isHovering) { // ホバー中でなければフェードアウト
                    setIsFadingOut(true);
                    
                    // フェードアウト完了後に変更状態をクリア（2秒後）
                    setTimeout(() => {
                        clearChangeState(message?.id);
                        setIsFadingOut(false);
                    }, 2000);
                }
            }, 15000); // 15秒でフェードアウト（合計約17秒程度）
        }
        
        // クリーンアップ
        return () => {
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
            }
        };
    }, [changeState, isHovering, message?.id, clearChangeState]);

    // ホバー状態が変わったときの処理
    useEffect(() => {
        if (isHovering && isFadingOut) {
            // ホバー中はフェードアウトを停止
            setIsFadingOut(false);
        } else if (!isHovering && changeState) {
            // ホバーが終了したらフェードアウトタイマーを再開
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
            }
            fadeTimeoutRef.current = setTimeout(() => {
                setIsFadingOut(true);
                setTimeout(() => {
                    clearChangeState(message?.id);
                    setIsFadingOut(false);
                }, 2000);
            }, 5000); // ホバー終了後5秒でフェードアウト開始
        }
    }, [isHovering, changeState, message?.id, clearChangeState]);

    // 変更バーのスタイルクラスを決定
    const getChangeBarClass = () => {
        if (!changeState) return 'bar-none';
        
        switch (changeState.type) {
            case 'added':
                return 'bar-added';
            case 'modified':
                return 'bar-modified';
            case 'deleted':
                return 'bar-deleted';
            case 'reordered':
                return 'bar-reordered';
            default:
                return 'bar-none';
        }
    };

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

    // 空白行判定
    const isBlank = !message?.msg || message.msg.trim() === '';

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
                    data-row-id={rowElementId} // ロック管理用のdata属性
                >
                    <div 
                        className={`change-bar ${getChangeBarClass()}${isFadingOut ? ' fade-out' : ''}`}
                        title={changeState ? `【${changeState.type === 'added' ? '空行追加' : 
                               changeState.type === 'modified' ? '内容編集' : 
                               changeState.type === 'deleted' ? '削除' : 
                               changeState.type === 'reordered' ? '順序変更' : ''}】
実行者: ${changeState.userNickname}
時刻: ${changeState.timestamp.toLocaleString()}` : ''}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >  </div>
                    
                    <span {...provided.dragHandleProps} className='maru' />
                    <div
                        id={rowElementId}
                        className='doc-comment-content'
                        contentEditable={isEditing && !locked} // ロック中は編集不可
                        suppressContentEditableWarning={true}
                        ref={contentRef}
                        onBlur={handleBlur}
                        onInput={handleInput}
                        tabIndex={0}
                        spellCheck={true}
                        style={!isBlank ? getReactionHighlight() : {}} // 空白行でない場合のみハイライト適用
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
                        <>
                            {/* ホバー時のみ表示される編集・削除・追加ボタン（右端に横並び） */}
                            <button
                                className="edit-button p-1 ml-1 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded-full shadow-md border"
                                title="編集"
                                onClick={handleEdit}
                                tabIndex={-1}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                            </button>
                            {isBlank && (
                                <button
                                    className="delete-button p-1 ml-1 bg-white text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-full shadow-md border"
                                    title="空白行を削除"
                                    onClick={handleDelete}
                                    tabIndex={-1}
                                    type="button"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" /><path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                                </button>
                            )}
                            <button
                                className="add-button p-1 bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-200 rounded-full shadow-md border"
                                title="下に行を挿入"
                                onClick={handleAddBelow}
                                tabIndex={-1}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                            </button>
                        </>
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