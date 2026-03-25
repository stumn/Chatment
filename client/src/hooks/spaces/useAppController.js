// src/hooks/useAppController.js

import { useCallback, useMemo } from 'react';
import useSocket from '../shared/useSocket';
import usePostStore from '../../store/spaces/postStore';
import useAppStore from '../../store/spaces/appStore';
import {
    MESSAGE_VALIDATION_REASON,
    validateAndNormalizeMessage,
    resolveValidationFailure
} from '../../utils/messageValidation';

const CHAT_VALIDATION_REASON_MAP = {
    [MESSAGE_VALIDATION_REASON.EMPTY]: {
        message: 'メッセージが空です。文字を入力してください。'
    },
    [MESSAGE_VALIDATION_REASON.TOO_LONG]: {
        message: 'メッセージが140文字を超えています。短くしてください。',
        warnMessage: 'Message too long, truncating to 140 characters'
    },
    [MESSAGE_VALIDATION_REASON.TOO_MANY_LINES]: {
        message: '改行数が5行を超えています。短くしてください。',
        warnMessage: 'Too many lines in chat message, limiting to 5 lines'
    },
    [MESSAGE_VALIDATION_REASON.INVALID_AFTER_NORMALIZE]: {
        message: '有効な文字が含まれていません。'
    }
};

/**
 * アプリケーションの中央制御フック
 * - Socket通信とストア管理を一元化
 * - ビジネスロジックを集約
 * - エラーハンドリングとパフォーマンス最適化を提供
 */
export const useAppController = () => {
    // Socket通信関連の取得
    const {
        // ドキュメント操作
        emitDocAdd,
        emitDocEdit,
        emitDocDelete,
        emitDocReorder,
        emitIndentChange,

        // チャット操作
        emitChatMessage,
        emitPositive,
        emitNegative,

        // ロック操作
        emitDemandLock,
        emitUnlockRow,

        // その他
        heightArray,
        socketId,
        emitLog
    } = useSocket();

    // Store関連の取得
    const userInfo = useAppStore((state) => state.userInfo);
    const { removePost } = usePostStore();

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
    }, [userInfo]);

    const getDocumentOriginalMessage = useCallback((documentId) => {
        const posts = usePostStore.getState().posts;
        const originalPost = posts.find((post) => post.id === documentId);
        return originalPost?.msg || '';
    }, []);

    const logDocumentValidationFailure = useCallback((action, detail) => {
        emitLog({
            userId: userInfo?._id,
            userNickname: userInfo?.nickname,
            action,
            detail
        });
    }, [emitLog, userInfo]);

    const validateAndNormalizeDocumentMessage = useCallback((documentId, inputMsg, originalMsg) => {
        const validation = validateAndNormalizeMessage(inputMsg, { maxLength: 140, maxLines: 5 });
        if (validation.success) {
            return validation;
        }

        if (validation.reason === MESSAGE_VALIDATION_REASON.EMPTY) {
            console.warn('Empty content - requires delete confirmation');
            logDocumentValidationFailure('document-edit-empty-validation', {
                documentId,
                originalMsg,
                attemptedMsg: inputMsg
            });

            return {
                success: false,
                requiresDeleteConfirmation: true,
                postId: documentId
            };
        }

        if (validation.reason === MESSAGE_VALIDATION_REASON.TOO_LONG) {
            console.warn('Document content too long, truncating to 140 characters');
            logDocumentValidationFailure('document-edit-length-validation-error', {
                documentId,
                originalMsg,
                attemptedMsg: inputMsg,
                length: validation.length
            });

            return { success: false, error: '文字数が140文字を超えています。短くしてください。' };
        }

        if (validation.reason === MESSAGE_VALIDATION_REASON.TOO_MANY_LINES) {
            console.warn('Too many lines, limiting to 5 lines');
            logDocumentValidationFailure('document-edit-lines-validation-error', {
                documentId,
                originalMsg,
                attemptedMsg: inputMsg,
                lineCount: validation.lineCount
            });

            return { success: false, error: '改行数が5行を超えています。短くしてください。' };
        }

        logDocumentValidationFailure('document-edit-invalid-chars-validation-error', {
            documentId,
            originalMsg,
            attemptedMsg: inputMsg
        });

        return { success: false, error: '有効な文字が含まれていません。' };
    }, [logDocumentValidationFailure]);

    const submitDocumentEdit = useCallback((documentId, validatedMsg) => {
        emitDocEdit({
            id: documentId,
            newMsg: validatedMsg,
            nickname: userInfo?.nickname,
            updatedAt: new Date().toISOString()
        });
    }, [emitDocEdit, userInfo]);

    const logDocumentEditResult = useCallback((documentId, inputMsg, originalMsg, validatedMsg) => {
        const action = validatedMsg.startsWith('#') ? 'document-edit-heading' : 'document-edit';

        emitLog({
            userId: userInfo?._id,
            userNickname: userInfo?.nickname,
            action,
            detail: {
                documentId,
                originalMsg,
                validatedMsg,
                originalLength: originalMsg?.length,
                messageLength: validatedMsg?.length,
                inputLength: inputMsg?.length
            }
        });
    }, [emitLog, userInfo]);

    /**
     * ドキュメントを編集する（楽観的更新付き）
     * @param {string} id - 編集対象のID
     * @param {string} newMsg - 新しいメッセージ
     * @returns {Object} { success: boolean, error?: string, validatedMsg?: string }
     */
    const editDocument = useCallback((id, newMsg) => {
        try {
            // 編集前の内容を取得
            const originalMsg = getDocumentOriginalMessage(id);

            // バリデーションと正規化
            const validationResult = validateAndNormalizeDocumentMessage(id, newMsg, originalMsg);
            if (!validationResult.success) return validationResult;

            // 楽観的更新: 即座にUIを更新
            const { validatedMsg } = validationResult;
            submitDocumentEdit(id, validatedMsg);

            // ログ記録
            logDocumentEditResult(id, newMsg, originalMsg, validatedMsg);

            return { success: true, validatedMsg };

        } catch (error) {
            console.error('Failed to edit document:', error);
            return { success: false, error: '編集に失敗しました。もう一度お試しください。' };
        }
    }, [getDocumentOriginalMessage, validateAndNormalizeDocumentMessage,
        submitDocumentEdit, logDocumentEditResult]);

    /**
     * ドキュメントを削除する（楽観的更新付き）
     * @param {string} id - 削除対象のID
     * @param {string} reason - 削除理由（オプション）
     */
    const deleteDocument = useCallback((id, reason = 'manual') => {
        try {
            // 楽観的更新: 即座にUIから削除
            removePost(id);

            // サーバーに送信
            emitDocDelete(id);

            // 削除前の内容を取得（ログ用）
            const posts = usePostStore.getState().posts;
            const deletedPost = posts.find(p => p.id === id);
            const deletedContent = deletedPost?.msg || '';

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
    }, [userInfo]);

    // ===== CHAT操作 =====

    /**
     * チャットメッセージを送信
     * @param {string} handleName - 表示名
     * @param {string} message - メッセージ内容
     * @returns {Object} { success: boolean, error?: string }
     */
    const sendChatMessage = useCallback((handleName, message) => {
        try {
            const validation = validateAndNormalizeMessage(message, { maxLength: 140, maxLines: 5 });

            const validationError = resolveValidationFailure(validation, CHAT_VALIDATION_REASON_MAP);
            if (validationError) {
                if (validationError.warnMessage) {
                    console.warn(validationError.warnMessage);
                }
                return { success: false, error: validationError.message };
            }

            const { validatedMsg } = validation;

            emitChatMessage(handleName, validatedMsg, userInfo?._id);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'chat-send',
                detail: { handleName, messageLength: validatedMsg.length }
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send chat message:', error);
            return { success: false, error: 'メッセージの送信に失敗しました。もう一度お試しください。' };
        }
    }, [emitLog, emitChatMessage, userInfo]);

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