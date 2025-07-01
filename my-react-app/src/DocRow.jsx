// File: my-react-app/src/DocRow.jsx

import React, { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';

import useChatStore from './store/chatStore';
import './Doc.css'; // Assuming you have a CSS file for styling

const DocRow = ({ data, index, style }) => {

    // data からメッセージを取得 data = {docMessages, userInfo, emitChatMessage}
    const { docMessages, userInfo, emitChatMessage, dropTargetInfo } = data;
    const name = userInfo?.nickname || 'Unknown'; // ユーザー名を取得

    const message = docMessages[index];

    // useChatStoreから必要な関数を取得
    const customAddMessage = useChatStore((state) => state.customAddMessage);
    const updateMessage = useChatStore((state) => state.updateMessage);

    // 編集状態を管理するためのステート
    const [isEditing, setIsEditing] = useState(null);

    // contentEditableの要素を参照するためのref
    const contentRef = useRef(null);

    // クリック時の処理
    const handleClick = () => {

        // 編集中の行があれば、その行の編集を終了
        if (isEditing !== null && contentRef.current) {
            console.log('🌟Editing ended for element:', contentRef.current.id);

            // 現在の編集行のインデックスを取得
            const currentEditingIndex = parseInt(contentRef.current.id.split('-')[1], 10);

            // 編集中の行が現在の行と異なる場合、メッセージを更新
            if (currentEditingIndex !== index) {
                docMessages.updateMessage(currentEditingIndex, contentRef.current.textContent);
            }
            // 編集状態を終了
            setIsEditing(null);
        }

        docMessages.forEach((msg, i) => {
            if (i !== index && msg.isEditing) {
                docMessages.updateMessage(i, msg.msg);
            }
        });

        setIsEditing(`dc-${index}`);
    };

    // フォーカス時の処理
    const handleFocus = () => {

        // フォーカス時にカーソルを末尾に移動
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        contentRef.current.focus();

        setIsEditing(`dc-${index}`);
        console.log('🌟Focus on element:', contentRef.current.id);
    };

    // カーソルを末尾に移動する関数
    const putCaretTheLast = () => {

        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        contentRef.current.focus();
    }

    // キーダウン処理
    const handleKeyDown = (e) => {

        if (isEditing !== `dc-${index}`) {
            // 編集中の行でない場合は何もしない
            console.log('🌟Not editing, ignoring key press:', e.key)
            return;
        }

        // 編集中の行でEnterキーやスペースキーが押されたときの処理
        console.log('🌟Key pressed:', e.key, e.code);

        switch (e.key) {
            case 'Enter':
                e.preventDefault();// Enterキーで改行を防ぐ

                console.log('🌟Enter pressed, current text:', contentRef.current.id);

                console.log('🌟Current message:', message);

                // 下に1行追加
                customAddMessage({
                    name: message?.nickname || 'Unknown',
                    msg: '',
                    order: message?.order + 1 || 1,
                });

                // 新しく追加した行にフォーカスを移動
                const newIndexID = `dc-${index + 1}`;
                console.log('🌟New index ID:', newIndexID);

                const element = document.getElementById(newIndexID);
                console.log('🌟Element to focus:', element);

                setTimeout(() => {
                    if (element) {
                        element.focus();
                        element.contentEditable = true; // 新しい行を編集可能にする
                        console.log('🌟Focus moved to new element:', element);
                    }
                }, 0);

                break;

            case ' ':
            case 'Space': // スペースキー
            case 'Spacebar':
            case 'NumpadSpace': // 数字キーのスペース
            case 'Process': // 全角スペースキー
            case '　': // 全角スペースキー（日本語入力時など）
            case 'Tab': // タブキーもスペースキーとして扱う

                // スペースキーでインデントを追加
                if (contentRef.current.textContent === '') {
                    e.preventDefault(); // スペースキーでのデフォルト動作を防ぐ
                    contentRef.current.textContent += '●';
                }

                // フォーカス時にカーソルを末尾に移動
                putCaretTheLast();
                break;

            case 'ArrowDown':
                // 下矢印キーで次の行に移動
                e.preventDefault();
                const nextIndex = index + 1;
                if (nextIndex < data.length) {
                    const nextElement = document.getElementById(`dc-${nextIndex}`);
                    if (nextElement) {
                        nextElement.focus();
                        nextElement.contentEditable = true; // 次の行を編集可能にする
                        console.log('🌟Moved to next element:', nextElement.id);
                    }
                }
                break;

            case 'ArrowUp':
                // 上矢印キーで前の行に移動
                e.preventDefault();
                const prevIndex = index - 1;
                if (prevIndex >= 0) {
                    const prevElement = document.getElementById(`dc-${prevIndex}`);
                    if (prevElement) {
                        prevElement.focus();
                        prevElement.contentEditable = true; // 前の行を編集可能にする
                        console.log('🌟Moved to previous element:', prevElement.id);
                    }
                }
                break;

            case 'Escape':
                // Escapeキーで編集を終了
                handleBlur(e);
                break;
            default:
                // 他のキーは何もしない
                console.log('🌟Other key pressed, ignoring:', e.key);
                break;

        }
    };

    // 編集が終了したときの処理
    const handleBlur = (e) => {
        updateMessage(index, e.target.textContent);
        setIsEditing(null);
        console.log('🌟Blur event, current text:', e.target.textContent);
    };

    // ★追加: 親からドロップターゲット情報を受け取る
    const { targetIndex, sourceIndex } = dropTargetInfo || {};

    let isDropTarget = false;

    // ドロップ先が自分で、かつドラッグ元とドロップ先が異なる場合
    if (targetIndex !== null && sourceIndex !== null && targetIndex === index && sourceIndex !== index) {
        isDropTarget = true;
    }

    // アイテムを下に移動中、元の位置のすぐ下もターゲットにする
    if (targetIndex !== null && sourceIndex !== null && targetIndex > sourceIndex && index === sourceIndex + 1 && targetIndex === index) {
        isDropTarget = true;
    }

    // アイテムを上に移動中、元の位置のすぐ下もターゲットにする

    // ★要望2: インジケータ（罫線）用のスタイルを定義
    const indicatorStyle = isDropTarget ? {
        borderTop: '2px solid #3498db', // 青いハイライト線
        margin: '-1px 0', // 線の太さ分、レイアウトがずれないように調整
    } : {};


    return (
        <Draggable draggableId={String(index)} index={index} key={index}>
            {(provided, snapshot) => {
                // ★改善: ドラッグ中の元のアイテムのスタイルを定義
                const draggingStyle = snapshot.isDragging
                    ? {
                        opacity: 1, // ★完全に見えるようにする
                        visibility: 'visible', // ★ライブラリによって隠されるのを防ぐ
                    }
                    : {};

                return (
                    <div
                        className='doc-comment-item'
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                            ...style,
                            ...provided.draggableProps.style,
                            ...indicatorStyle, // ★最重要: インジケータスタイルを適用
                            ...draggingStyle,   // ★ドラッグ元のアイテムを非表示にするスタイルを適用
                        }}
                        onClick={() => handleClick()}
                    >
                        <span {...provided.dragHandleProps} className='maru' />

                        <div
                            id={`dc-${index}`}
                            className='doc-comment-content'

                            contentEditable={isEditing === `dc-${index}`}
                            suppressContentEditableWarning

                            ref={contentRef}

                            onFocus={() => handleFocus()}
                            onKeyDown={(e) => handleKeyDown(e)}
                            onBlur={handleBlur}
                        >
                            {message?.msg || ''}
                        </div>
                    </div>
                );
            }}
        </Draggable >
    );
};

export default React.memo(DocRow);