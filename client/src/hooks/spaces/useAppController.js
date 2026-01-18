// src/hooks/useAppController.js

import { useCallback, useMemo } from 'react';
import useSocket from '../shared/useSocket';
import usePostStore from '../../store/spaces/postStore';
import useAppStore from '../../store/spaces/appStore';

/**
 * アプリケーションの中央制御フック
 * - Socket通信とストア管理を一元化
 * - ビジネスロジックを集約
 * - エラーハンドリングとパフォーマンス最適化を提供
 */
export const useAppController = () => {
    // Socket通信関連の取得
    const socketFunctions = useSocket();
    const {
        emitDocAdd,
        emitDocEdit,
        emitDocDelete,
        emitDocReorder,
        emitIndentChange,
        emitChatMessage,
        emitPositive,
        emitNegative,
        emitDemandLock,
        emitUnlockRow,
        heightArray,
        socketId,
        emitLog
    } = socketFunctions;

    // Store関連の取得
    const userInfo = useAppStore((state) => state.userInfo);
    const { addPost, updatePost, removePost, reorderPost } = usePostStore();

    // ===== DOCUMENT操作 =====

    /**
     * 新しいドキュメント行を追加する
     * @param {object} payload - 新規ドキュメントのデータ
     */
    const addDocument = useCallback((payload) => {
        try {
            emitDocAdd({
                ...payload,
                nickname: userInfo?.nickname || 'Unknown',
                status: userInfo?.status,
                ageGroup: userInfo?.ageGroup,
                timestamp: new Date().toISOString()
            });

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-add',
                detail: { insertAfterDocumentId: payload.insertAfterId }
            });
        } catch (error) {
            console.error('Failed to add document:', error);
        }
        // emitDocAdd, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    /**
     * ドキュメントを編集する（楽観的更新付き）
     * @param {string} id - 編集対象のID
     * @param {string} newMsg - 新しいメッセージ
     * @returns {Object} { success: boolean, error?: string, validatedMsg?: string }
     */
    const editDocument = useCallback((id, newMsg) => {
        try {
            // 元の内容を取得（ログ用）
            const posts = usePostStore.getState().posts;
            const originalPost = posts.find(p => p.id === id);
            const originalMsg = originalPost?.msg || '';

            // 基本バリデーション
            // 内容が空のときは，この行を削除しますか？という確認を行いたい
            if (!newMsg?.trim()) {
                console.warn('Empty content - requires delete confirmation');
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit-empty-validation',
                    detail: { documentId: id, originalMsg, attemptedMsg: newMsg }
                });
                return {
                    success: false,
                    requiresDeleteConfirmation: true,
                    postId: id
                };
            }

            // 文字数制限（140文字）
            let validatedMsg = newMsg;
            if (newMsg.length > 140) {
                console.warn('Document content too long, truncating to 140 characters');
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit-length-validation-error',
                    detail: { documentId: id, originalMsg, attemptedMsg: newMsg, length: newMsg.length }
                });
                return { success: false, error: '文字数が140文字を超えています。短くしてください。' };
            }

            // 改行数制限（5行まで）
            const lines = validatedMsg.split('\n');
            if (lines.length > 5) {
                console.warn('Too many lines, limiting to 5 lines');
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit-lines-validation-error',
                    detail: { documentId: id, originalMsg, attemptedMsg: newMsg, lineCount: lines.length }
                });
                return { success: false, error: '改行数が5行を超えています。短くしてください。' };
            }

            // 基本的な禁止文字除去（制御文字の除去、改行・タブ以外）
            validatedMsg = validatedMsg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

            // 基本的な文字正規化
            validatedMsg = validatedMsg
                .replace(/\r/g, '')              // キャリッジリターン除去
                .replace(/\n{3,}/g, '\n\n')      // 3つ以上の連続改行を2つに制限
                .trim();                         // 前後の空白除去

            // 正規化後に再度空チェック
            if (!validatedMsg) {
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit-invalid-chars-validation-error',
                    detail: { documentId: id, originalMsg, attemptedMsg: newMsg }
                });
                return { success: false, error: '有効な文字が含まれていません。' };
            }

            // 1文字目が#の場合、見出し行として扱う（#は削除しない・チャットには送信しない）
            if (validatedMsg.startsWith('#')) {

                // サーバーに送信
                emitDocEdit({
                    id,
                    newMsg: validatedMsg,
                    nickname: userInfo?.nickname,
                    updatedAt: new Date().toISOString()
                });

                // ログ記録
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit-heading',
                    detail: {
                        documentId: id,
                        originalMsg,
                        validatedMsg,
                        originalLength: originalMsg?.length,
                        messageLength: validatedMsg?.length,
                        inputLength: newMsg?.length
                    }
                });

                return { success: true, validatedMsg };

            } else {
                // サーバーに送信
                emitDocEdit({
                    id,
                    newMsg: validatedMsg,
                    nickname: userInfo?.nickname,
                    updatedAt: new Date().toISOString()
                });

                // ログ記録
                emitLog({
                    userId: userInfo?._id,
                    userNickname: userInfo?.nickname,
                    action: 'document-edit',
                    detail: {
                        documentId: id,
                        originalMsg,
                        validatedMsg,
                        originalLength: originalMsg?.length,
                        messageLength: validatedMsg?.length,
                        inputLength: newMsg?.length
                    }
                });

                return { success: true, validatedMsg };
            }


        } catch (error) {
            console.error('Failed to edit document:', error);
            return { success: false, error: '編集に失敗しました。もう一度お試しください。' };
        }
        // emitDocEdit, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo, updatePost]);

    /**
     * ドキュメントを削除する（楽観的更新付き）
     * @param {string} id - 削除対象のID
     * @param {string} reason - 削除理由（オプション）
     */
    const deleteDocument = useCallback((id, reason = 'manual') => {
        try {
            // 削除前の内容を取得（ログ用）
            const posts = usePostStore.getState().posts;
            const deletedPost = posts.find(p => p.id === id);
            const deletedContent = deletedPost?.msg || '';

            // 楽観的更新: 即座にUIから削除
            removePost(id);

            // サーバーに送信
            emitDocDelete(id);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                userNickname: userInfo?.nickname,
                action: 'document-delete',
                detail: {
                    documentId: id,
                    deletedContent,
                    contentLength: deletedContent.length,
                    reason,
                    displayOrder: deletedPost?.displayOrder,
                    indentLevel: deletedPost?.indentLevel
                }
            });
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
        // emitDocDelete, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removePost, userInfo]);

    /**
     * ドキュメントの並び替え
     * @param {object} data - 並び替えデータ
     */
    const reorderDocument = useCallback((data) => {
        try {
            // 編集前の情報を取得
            const posts = usePostStore.getState().posts;
            const oldOrder = posts.map(p => ({ id: p.id, displayOrder: p.displayOrder }));

            emitDocReorder({
                ...data,
                nickname: userInfo?.nickname + `(${userInfo?.status}+${userInfo?.ageGroup})` || 'Unknown',
                timestamp: new Date().toISOString()
            });

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-reorder',
                detail: {
                    ...data,
                    oldOrder: oldOrder
                }
            });
        } catch (error) {
            console.error('Failed to reorder document:', error);
        }
        // emitDocReorder, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    // ===== CHAT操作 =====

    /**
     * チャットメッセージを送信
     * @param {string} handleName - 表示名
     * @param {string} message - メッセージ内容
     * @param {string} roomId - ルームID
     * @returns {Object} { success: boolean, error?: string }
     */
    const sendChatMessage = useCallback((handleName, message, roomId) => {
        try {
            // バリデーション
            if (!message?.trim()) {
                return { success: false, error: 'メッセージが空です。文字を入力してください。' };
            }

            let validatedMessage = message;

            if (message.length > 140) {
                console.warn('Message too long, truncating to 140 characters');
                return { success: false, error: 'メッセージが140文字を超えています。短くしてください。' };
            }

            // 改行数制限（5行まで）
            const lines = message.split('\n');
            if (lines.length > 5) {
                console.warn('Too many lines in chat message, limiting to 5 lines');
                return { success: false, error: '改行数が5行を超えています。短くしてください。' };
            }

            // 基本的な禁止文字除去（制御文字の除去、改行・タブ以外）
            validatedMessage = validatedMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

            // 基本的な文字正規化
            validatedMessage = validatedMessage
                .replace(/\r/g, '')              // キャリッジリターン除去
                .replace(/\n{3,}/g, '\n\n')      // 3つ以上の連続改行を2つに制限
                .trim();                         // 前後の空白除去

            // 正規化後に再度空チェック
            if (!validatedMessage) {
                return { success: false, error: '有効な文字が含まれていません。' };
            }

            emitChatMessage(handleName, validatedMessage, userInfo?._id, roomId);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'chat-send',
                detail: { handleName, messageLength: validatedMessage.length, roomId }
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send chat message:', error);
            return { success: false, error: 'メッセージの送信に失敗しました。もう一度お試しください。' };
        }
        // emitChatMessage, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    /**
     * ポジティブ評価
     * @param {string} postId - 投稿ID
     */
    const addPositive = useCallback((postId) => {
        try {
            emitPositive(postId);
        } catch (error) {
            console.error('Failed to add positive:', error);
        }
    }, [emitPositive]);

    /**
     * ネガティブ評価
     * @param {string} postId - 投稿ID
     */
    const addNegative = useCallback((postId) => {
        try {
            emitNegative(postId);
        } catch (error) {
            console.error('Failed to add negative:', error);
        }
    }, [emitNegative]);

    // ===== ロック機能 =====

    /**
     * ドキュメント行のロックを要求
     * @param {string} rowElementId - 行のElement ID
     * @param {string} nickname - ユーザーのニックネーム  
     * @param {string} userId - ユーザーID
     */
    const requestLock = useCallback(async (rowElementId, nickname, userId) => {
        try {
            await emitDemandLock({
                rowElementId,
                nickname: nickname || userInfo?.nickname,
                userId: userId || userInfo?._id,
                timestamp: new Date().toISOString()
            });

            return { success: true };

        } catch (error) {
            console.error('Failed to request lock:', error);
            return { success: false, error: error.message };
        }
        // emitDemandLockはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    /**
     * ドキュメント行のロックを解除
     * @param {object} data - ロック解除データ
     */
    const unlockRow = useCallback((data) => {
        try {
            emitUnlockRow({
                ...data,
                nickname: userInfo?.nickname,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Failed to unlock row:', error);
        }
        // emitUnlockRowはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    /**
     * インデントレベルを変更する
     * @param {string} postId - 投稿ID
     * @param {number} newIndentLevel - 新しいインデントレベル (0-2)
     */
    const changeIndent = useCallback((postId, newIndentLevel) => {
        try {
            // 編集前の情報を取得
            const posts = usePostStore.getState().posts;
            const targetPost = posts.find(p => p.id === postId);
            const oldIndentLevel = targetPost?.indentLevel;

            console.log(postId, newIndentLevel);
            emitIndentChange(postId, newIndentLevel);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'indent-change',
                detail: {
                    documentId: postId,
                    newIndentLevel,
                    oldIndentLevel
                }
            });
        } catch (error) {
            console.error('Failed to change indent:', error);
        }
        // emitIndentChange, emitLogはuseSocket内で安定しているため依存配列から除外
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    // ===== 公開API =====
    const api = useMemo(() => ({
        // Document操作
        document: {
            add: addDocument,
            edit: editDocument,
            delete: deleteDocument,
            reorder: reorderDocument,
            requestLock,
            unlockRow,
            changeIndent
        },

        // Chat操作  
        chat: {
            send: sendChatMessage,
            addPositive,
            addNegative
        },

        // Socket情報
        socket: {
            id: socketId,
            heightArray
        },

        // 生のsocket関数（後方互換性のため）
        raw: socketFunctions,

        // ユーザー情報
        user: userInfo
    }), [
        addDocument, editDocument, deleteDocument, reorderDocument,
        requestLock, unlockRow, changeIndent, sendChatMessage, addPositive,
        addNegative, socketId, heightArray, socketFunctions,
        userInfo
    ]);

    return api;
};