// File: client/src/hooks/useEditMode.js

import { useState, useRef } from 'react';
import usePostStore from '../../store/spaces/postStore';

/**
 * 編集モードの状態と操作を管理するカスタムフック
 * @param {Object} message - メッセージオブジェクト
 * @param {Object} userInfo - ユーザー情報
 * @param {Function} edit - サーバーへの編集送信関数
 * @param {Object} listRef - リストの参照
 * @param {number} index - 行インデックス
 * @param {Function} unlockRow - ロック解除関数
 * @param {string} rowElementId - 行のElement ID
 * @returns {Object} 編集モード関連の状態と関数
 */
const useEditMode = (
    message,
    userInfo,
    edit,
    listRef,
    index,
    unlockRow,
    rowElementId
) => {
    // 編集状態を管理するステート
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState('');

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
    const startEdit = async (requestLock, rowElementId) => {
        // エラーをクリア
        setEditError('');

        // ロック要求がある場合は、応答を待つ
        if (requestLock) {
            try {
                const result = await requestLock(rowElementId, userInfo?.nickname, userInfo?._id);
                if (!result || !result.success) {
                    console.warn('Lock acquisition failed, not entering edit mode');
                    return;
                }
            } catch (error) {
                console.error('Failed to acquire lock:', error);
                return;
            }
        }

        // ロック取得成功後に編集モードに入る
        setIsEditing(true);
        focusAndMoveCursorToEnd();
    };

    /**
     * 編集内容を保存して編集モードを終了する
     * @param {string} newContent - 新しいコンテンツ
     */
    const saveAndFinishEdit = (newContent) => {
        setEditError(''); // エラーをクリア

        const originalContent = message.msg || '';

        // バリデーション付きで編集実行
        const result = edit && edit(message.id, newContent);

        if (result && !result.success) {
            // バリデーションエラーの場合、エラーメッセージを表示して編集モードを継続
            setEditError(result.error);
            return false; // 編集継続
        }

        // バリデーション成功時のローカル更新
        updateDocMessage(message.id, result?.validatedMsg || newContent);

        // 内容が実際に変更された場合のみ変更状態を記録 空白の追加の場合は変更とみなさない
        // 見出しの追加の場合には、チャットに追加しない
        // 異なる人が編集した場合には、チャット名前を追加する [+1] みたいな書き方？
        const finalContent = result?.validatedMsg || newContent;
        if (finalContent !== originalContent) {
            setChangeState(message.id, 'modified', userInfo?.nickname || 'Unknown');
        }

        // 編集完了時にロックを解除
        if (unlockRow && rowElementId) {
            unlockRow({ rowElementId, postId: message.id });
        }

        setIsEditing(false);
        resetListHeight();
        return true; // 編集完了
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
        editError,

        // 編集制御関数
        startEdit,
        handleBlur,
        handleCompleteEdit,
        handleInput,
        handleKeyDown,

        // エラー制御
        clearEditError: () => setEditError('')
    };
};

export default useEditMode;
