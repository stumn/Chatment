// src/hooks/useAppController.js

// ❌ 問題: このファイルが作成されているが、アプリケーション内でどこでも使用されていません
// 一方で、各コンポーネントで直接useSocketを呼び出しているため、ロジックが分散しています
// ✅ 修正案: 
// 1. このコントローラーを実際に使用してビジネスロジックを集約する
// 2. または、不要であれば削除してコードをシンプルに保つ

// 1. useSocket から socket通信を行う関数 (emit系) を受け取ります。
// 2. usePostStore や useAppStore から 状態を更新する関数 (action系) を受け取ります。

// 🎯UIコンポーネントのために、「状態更新」と「socket通信」を両方実行する
// ⇒　新しい関数（例：addDocument）を定義して提供します。

import useSocket from './useSocket'; // ✅ 修正: 正しいパスに変更
import usePostStore from '../store/postStore';
import useAppStore from '../store/appStore';

// src/hooks/useAppController.js

import { useCallback, useMemo } from 'react';
import useSocket from './useSocket';
import usePostStore from '../store/postStore';
import useAppStore from '../store/appStore';

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
            // TODO: ユーザーにエラー通知
        }
    }, [userInfo, emitDocAdd, emitLog]);

    /**
     * ドキュメントを編集する（楽観的更新付き）
     * @param {string} id - 編集対象のID
     * @param {string} newMsg - 新しいメッセージ
     */
    const editDocument = useCallback((id, newMsg) => {
        try {
            // 楽観的更新: 即座にUIを更新
            updatePost(id, newMsg, userInfo?.nickname);

            // サーバーに送信
            emitDocEdit({ 
                id, 
                newMsg, 
                nickname: userInfo?.nickname,
                updatedAt: new Date().toISOString()
            });

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'document-edit',
                detail: { id, messageLength: newMsg?.length }
            });
        } catch (error) {
            console.error('Failed to edit document:', error);
            // TODO: 楽観的更新をロールバック
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
            // TODO: 楽観的更新をロールバック
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
     */
    const sendChatMessage = useCallback((handleName, message) => {
        try {
            // バリデーション
            if (!message?.trim()) return;
            if (message.length > 1000) {
                console.warn('Message too long, truncating...');
                message = message.slice(0, 1000);
            }

            emitChatMessage(handleName, message.trim(), userInfo?._id);

            // ログ記録
            emitLog({
                userId: userInfo?._id,
                action: 'chat-send',
                detail: { handleName, messageLength: message.length }
            });
        } catch (error) {
            console.error('Failed to send chat message:', error);
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
     * @param {object} data - ロック要求データ
     */
    const requestLock = useCallback((data) => {
        try {
            emitDemandLock({
                ...data,
                nickname: userInfo?.nickname,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to request lock:', error);
        }
    }, [userInfo, emitDemandLock]);

    // ===== 公開API =====
    const api = useMemo(() => ({
        // Document操作
        document: {
            add: addDocument,
            edit: editDocument,
            delete: deleteDocument,
            reorder: reorderDocument,
            requestLock
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
        addDocument, editDocument, deleteDocument, reorderDocument, requestLock,
        sendChatMessage, addPositive, addNegative,
        socketId, heightArray, socketFunctions, userInfo
    ]);

    return api;
};