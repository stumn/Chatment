// File: client/src/hooks/useEditMode.js

import { useState, useRef } from 'react';
import usePostStore from './../store/postStore';

/**
 * 編集モードの状態と操作を管理するカスタムフック
 * @param {Object} message - メッセージオブジェクト
 * @param {Object} userInfo - ユーザー情報
 * @param {Function} edit - サーバーへの編集送信関数
 * @param {Object} listRef - リストの参照
 * @param {number} index - 行インデックス
 * @returns {Object} 編集モード関連の状態と関数
 */
const useEditMode = (
    message,
    userInfo,
    edit,
    listRef,
    index
) => {
    // 編集状態を管理するステート
    const [isEditing, setIsEditing] = useState(false);

    // contentEditableの要素を参照するためのref
    const contentRef = useRef(null);

    const updateDocMessage = usePostStore((state) => state.updatePost);
    const setChangeState = usePostStore((state) => state.setChangeState);


    /**
     * contentEditableにフォーカスを設定し、カーソルを末尾に移動する
     */
    const focusAndMoveCursorToEnd = () => {
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.focus();
                // キャレットを末尾に移動
                const range = document.createRange();
                range.selectNodeContents(contentRef.current);
                range.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, 0);
    };

    /**
     * リストの高さを再計算する（仮想リスト対応）
     */
    const resetListHeight = () => {
        if (listRef && listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(index, true);
        }
    };

    /**
     * 編集を開始する
     * @param {Function} requestLock - ロック要求関数
     * @param {string} rowElementId - 行のElement ID
     */
    const startEdit = (requestLock, rowElementId) => {
        // ロック要求を送信
        requestLock && requestLock(rowElementId, userInfo?.nickname, userInfo?._id);

        setIsEditing(true);
        focusAndMoveCursorToEnd();
    };

    /**
     * 編集内容を保存して編集モードを終了する
     * @param {string} newContent - 新しいコンテンツ
     */
    const saveAndFinishEdit = (newContent) => {
        const originalContent = message.msg || '';

        // ローカル状態とサーバーを更新
        updateDocMessage(message.id, newContent);
        edit && edit(message.id, newContent);

        // 内容が実際に変更された場合のみ変更状態を記録
        if (newContent !== originalContent) {
            setChangeState(message.id, 'modified', userInfo?.nickname || 'Unknown');
        }

        setIsEditing(false);
        resetListHeight();
    };

    /**
     * 編集終了（blur）時のハンドラー
     * @param {Event} e - blurイベント
     */
    const handleBlur = (e) => {
        const newContent = e.target.textContent.replace(/\r/g, '');
        saveAndFinishEdit(newContent);
    };

    /**
     * 編集完了ボタンクリック時のハンドラー
     */
    const handleCompleteEdit = () => {
        if (contentRef.current) {
            const newContent = contentRef.current.textContent.replace(/\r/g, '');
            saveAndFinishEdit(newContent);
        }
    };

    /**
     * 編集中の入力イベントハンドラー（高さ再計算用）
     */
    const handleInput = () => {
        resetListHeight();
    };

    /**
     * キーボードイベントハンドラー（Ctrl+Enter対応）
     * @param {KeyboardEvent} e - キーボードイベント
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && isEditing) {
            e.preventDefault(); // デフォルトの改行動作を防ぐ
            handleCompleteEdit();
        }
    };

    return {
        // 状態
        isEditing,
        contentRef,

        // 編集制御関数
        startEdit,
        handleBlur,
        handleCompleteEdit,
        handleInput,
        handleKeyDown
    };
};

export default useEditMode;
