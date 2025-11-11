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

    // socketFunctionsの参照を安定化（useMemoで包む）
    const stableSocketFunctions = useMemo(() => socketFunctions, [socketFunctions]);

    // ===== DOCUMENT操作 =====

    /**
     * 新しいドキュメント行を追加する
     * @param {object} payload - 新規ドキュメントのデータ
     */
    const addDocument = useCallback((payload) => {
        try {
            const data = {
                ...payload,
                nickname: userInfo?.nickname || 'Unknown',
                status: userInfo?.status,
                ageGroup: userInfo?.ageGroup,
                timestamp: new Date().toISOString()
            };

            emitDocAdd(data);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-add',
                detail: { insertAfterId: payload.insertAfterId }
            });
        } catch (error) {
            console.error('Failed to add document:', error);
        }
    }, [userInfo, emitDocAdd, emitLog]);

    /**
     * ドキュメントを編集する（楽観的更新付き）
     * @param {string} id - 編集対象のID
     * @param {string} newMsg - 新しいメッセージ
     * @returns {Object} { success: boolean, error?: string, validatedMsg?: string }
     */
    const editDocument = useCallback((id, newMsg) => {
        try {
            // 基本バリデーション
            if (!newMsg?.trim()) {
                console.warn('Empty content not allowed for document edit');
                return { success: false, error: '内容が空です。文字を入力してください。' };
            }

            // 文字数制限（140文字）
            let validatedMsg = newMsg;
            if (newMsg.length > 140) {
                console.warn('Document content too long, truncating to 140 characters');
                return { success: false, error: '文字数が140文字を超えています。短くしてください。' };
            }

            // 改行数制限（5行まで）
            const lines = validatedMsg.split('\n');
            if (lines.length > 5) {
                console.warn('Too many lines, limiting to 5 lines');
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
                    action: 'document-edit-heading',
                    detail: { id, messageLength: validatedMsg?.length, originalLength: newMsg?.length }
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
                    action: 'document-edit',
                    detail: { id, messageLength: validatedMsg?.length, originalLength: newMsg?.length }
                });

                return { success: true, validatedMsg };
            }


        } catch (error) {
            console.error('Failed to edit document:', error);
            return { success: false, error: '編集に失敗しました。もう一度お試しください。' };
        }
    }, [userInfo, updatePost, emitDocEdit, emitLog]);

    /**
     * ドキュメントを削除する（楽観的更新付き）
     * @param {string} id - 削除対象のID
     */
    const deleteDocument = useCallback((id) => {
        try {
            // 楽観的更新: 即座にUIから削除
            removePost(id);

            // サーバーに送信
            emitDocDelete(id);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-delete',
                detail: { id }
            });
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    }, [removePost, emitDocDelete, emitLog, userInfo]);

    /**
     * ドキュメントの並び替え
     * @param {object} data - 並び替えデータ
     */
    const reorderDocument = useCallback((data) => {
        try {
            emitDocReorder({
                ...data,
                nickname: userInfo?.nickname + `(${userInfo?.status}+${userInfo?.ageGroup})` || 'Unknown',
                timestamp: new Date().toISOString()
            });

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-reorder',
                detail: data
            });
        } catch (error) {
            console.error('Failed to reorder document:', error);
        }
    }, [userInfo, emitDocReorder, emitLog]);

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

            console.log(`📤[useAppController] Sending chat message from ${handleName}: "${validatedMessage}" to room ${roomId}`);
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
    }, [userInfo, emitChatMessage, emitLog]);

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
    const requestLock = useCallback((rowElementId, nickname, userId) => {
        try {
            emitDemandLock({
                rowElementId,
                nickname: nickname || userInfo?.nickname,
                userId: userId || userInfo?._id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to request lock:', error);
        }
    }, [userInfo, emitDemandLock]);

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
    }, [userInfo, emitUnlockRow]);

    // ===== 公開API =====
    const api = useMemo(() => ({
        // Document操作
        document: {
            add: addDocument,
            edit: editDocument,
            delete: deleteDocument,
            reorder: reorderDocument,
            requestLock,
            unlockRow
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
        raw: stableSocketFunctions, // 安定化されたsocketFunctionsを使用

        // ユーザー情報
        user: userInfo
    }), [
        addDocument, editDocument, deleteDocument, reorderDocument,
        requestLock, unlockRow, sendChatMessage, addPositive,
        addNegative, socketId, heightArray, stableSocketFunctions,
        userInfo
    ]);

    return api;
};