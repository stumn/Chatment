// src/hooks/useAppController.js

// 1. useSocket から socket通信を行う関数 (emit系) を受け取ります。
// 2. usePostStore や useAppStore から 状態を更新する関数 (action系) を受け取ります。

// 🎯UIコンポーネントのために、「状態更新」と「socket通信」を両方実行する
// ⇒　新しい関数（例：addDocument）を定義して提供します。

import useSocket from '../store/useSocket';
import usePostStore from '../store/postStore';
import useAppStore from '../store/appStore';

export const useAppController = () => {
    // 内部で各フックを呼び出す
    const {
        emitDocAdd,
        emitDocEdit,
        emitDocDelete,
        // ...他のemit関数
    } = useSocket();

    const { userInfo } = useAppStore();
    const { addPost, updatePost, removePost } = usePostStore();

    // UIコンポーネントに提供する、より意味のある名前の関数を定義

    /**
     * 新しいドキュメント行を追加する
     * @param {object} payload - 新規ドキュメントのデータ
     */
    const addDocument = (payload) => {
        // ここで通信と状態更新を両方行う
        const data = {
            ...payload,
            nickname: userInfo.nickname,
            // ...その他必要な情報
        };
        emitDocAdd(data);
        // ※ストアの更新は、socketからの受信イベント(doc-add)に任せるのが一般的
        // addPost(data); // optimistic UI を実装する場合はここで行う
    };

    /**
     * ドキュメントを編集する
     * @param {string} id - 編集対象のID
     * @param {string} newMsg - 新しいメッセージ
     */
    const editDocument = (id, newMsg) => {
        // 状態を即時更新 (Optimistic Update)
        updatePost(id, newMsg, userInfo.nickname);

        // サーバーに通信
        emitDocEdit({ id, newMsg, nickname: userInfo.nickname });
    };

    /**
     * ドキュメントを削除する
     * @param {string} id - 削除対象のID
     */
    const deleteDocument = (id) => {
        // 状態を即時更新
        removePost(id);

        // サーバーに通信
        emitDocDelete(id);
    };

    // UIが必要とする操作をまとめたオブジェクトを返す
    return {
        addDocument,
        editDocument,
        deleteDocument,
        // ... 他の操作関数
    };
};