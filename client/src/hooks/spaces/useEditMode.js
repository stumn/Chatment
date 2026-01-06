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
 * @param {Function} deleteDoc - 削除関数
 * @param {Function} emitLog - ログ送信関数
 * @returns {Object} 編集モード関連の状態と関数
 */
const useEditMode = (
    message,
    userInfo,
    edit,
    listRef,
    index,
    unlockRow,
    rowElementId,
    deleteDoc,
    emitLog
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
                    // ロック取得失敗のログ
                    emitLog && emitLog({
                        userId: userInfo?._id,
                        userNickname: userInfo?.nickname,
                        action: 'edit-lock-failed',
                        detail: { postId: message.id, rowElementId }
                    });
                    return;
                }
            } catch (error) {
                console.error('Failed to acquire lock:', error);
                // ロック取得エラーのログ
                emitLog && emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'edit-lock-error',
                    detail: { postId: message.id, rowElementId, error: error.message }
                });
                return;
            }
        }

        // ロック取得成功後に編集モードに入る
        setIsEditing(true);
        focusAndMoveCursorToEnd();

        // 編集開始のログ
        emitLog && emitLog({
            userId: userInfo?._id,
            userNickname: userInfo?.nickname,
            action: 'edit-start',
            detail: {
                postId: message.id,
                rowElementId,
                originalContent: message.msg || '',
                contentLength: (message.msg || '').length
            }
        });
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
            // 削除確認が必要な場合
            if (result.requiresDeleteConfirmation) {
                // 削除確認ダイアログ表示のログ
                emitLog && emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'edit-empty-delete-confirm-shown',
                    detail: {
                        postId: message.id,
                        originalContent,
                        attemptedContent: newContent
                    }
                });

                const shouldDelete = window.confirm(
                    '内容が空です。この行を削除しますか？\n\n' +
                    'OK: 行を削除\nキャンセル: 編集を続ける'
                );

                if (shouldDelete) {
                    // 削除確認でOKを選択したログ
                    emitLog && emitLog({
                        userId: userInfo?._id,
                        userNickname: userInfo?.nickname,
                        action: 'edit-empty-delete-confirmed',
                        detail: {
                            postId: message.id,
                            originalContent,
                            deletionReason: 'empty-content-via-edit'
                        }
                    });

                    // ロックを解除してから削除アクションを返す
                    if (unlockRow && rowElementId) {
                        unlockRow({ rowElementId, postId: message.id });
                    }
                    setIsEditing(false);
                    return { action: 'delete', postId: result.postId, reason: 'empty-content-via-edit' };
                } else {
                    // 削除確認でキャンセルを選択したログ
                    emitLog && emitLog({
                        userId: userInfo?._id,
                        userNickname: userInfo?.nickname,
                        action: 'edit-empty-delete-cancelled',
                        detail: { postId: message.id }
                    });

                    // 編集を続ける
                    setEditError('内容を入力してください');
                    return false; // 編集継続
                }
            }

            // その他のバリデーションエラーの場合、エラーメッセージを表示して編集モードを継続
            emitLog && emitLog({
                userId: userInfo?._id,
                userNickname: userInfo?.nickname,
                action: 'edit-validation-error',
                detail: {
                    postId: message.id,
                    error: result.error,
                    originalContent,
                    attemptedContent: newContent,
                    attemptedLength: newContent?.length
                }
            });

            setEditError(result.error);
            return false; // 編集継続
        }

        // バリデーション成功時のローカル更新
        updateDocMessage(message.id, result?.validatedMsg || newContent);

        // 内容が実際に変更された場合のみ変更状態を記録 空白の追加の場合は変更とみなさない
        // 見出しの追加の場合には、チャットに追加しない
        // 異なる人が編集した場合には、チャット名前を追加する [+1] みたいな書き方？
        const finalContent = result?.validatedMsg || newContent;
        const contentChanged = finalContent !== originalContent;

        if (contentChanged) {
            setChangeState(message.id, 'modified', userInfo?.nickname || 'Unknown');
        }

        // 編集完了のログ（変更の有無に関わらず）
        emitLog && emitLog({
            userId: userInfo?._id,
            userNickname: userInfo?.nickname,
            action: contentChanged ? 'edit-completed-with-change' : 'edit-completed-no-change',
            detail: {
                postId: message.id,
                originalContent,
                finalContent,
                originalLength: originalContent.length,
                finalLength: finalContent.length,
                isHeading: finalContent.startsWith('#')
            }
        });

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
        const result = saveAndFinishEdit(newContent);

        // 削除アクションが返された場合
        if (result && result.action === 'delete') {
            deleteDoc && deleteDoc(result.postId, result.reason || 'empty-content-via-edit');
        }
    };

    /**
     * 編集完了ボタンクリック時のハンドラー
     */
    const handleCompleteEdit = () => {
        if (contentRef.current) {
            const newContent = contentRef.current.textContent.replace(/\r/g, '');
            const result = saveAndFinishEdit(newContent);

            // 削除アクションが返された場合
            if (result && result.action === 'delete') {
                deleteDoc && deleteDoc(result.postId, result.reason || 'empty-content-via-edit');
            }
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
