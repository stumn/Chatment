import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ドキュメントページのデータ管理フック
 * 
 * 機能:
 * - URLパラメータの処理・バリデーション
 * - スペース情報の取得
 * - 投稿データの取得
 * - エラー・ローディング状態の管理
 */
export const useDocumentData = () => {
    // === URLパラメータ処理 ===
    const { spaceId, docId } = useParams();
    const currentSpaceId = parseInt(spaceId, 10);
    const currentDocId = parseInt(docId, 10);

    // === 状態管理 ===
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceData, setSpaceData] = useState(null);

    // === バリデーション ===
    const isValidDocId = !isNaN(currentDocId) && currentDocId >= 0;

    // === URLパラメータバリデーション ===
    useEffect(() => {

        // spaceIdのバリデーション
        if (!currentSpaceId || isNaN(currentSpaceId)) {
            const errorMsg = `無効なスペースID: "${spaceId}"\n\n` +
                `正の整数を指定してください。\n` +
                `例: /document/1/0`;
            console.error('Invalid spaceId:', { provided: spaceId, parsed: currentSpaceId });
            setError(errorMsg);
            return;
        }

        // docIdのバリデーション  
        if (!isValidDocId) {
            let errorMsg = `無効なドキュメントID: "${docId}"\n\n`;

            if (isNaN(currentDocId)) {
                errorMsg += `数値を指定してください。\n` +
                    `例: /document/${currentSpaceId}/0 （全投稿表示）`;
            } else if (currentDocId < 0) {
                errorMsg += `0以上の整数を指定してください。\n` +
                    `・0: 全投稿表示\n` +
                    `・1以上: セクション別表示（今後実装予定）`;
            }

            console.error('Invalid docId:', { provided: docId, parsed: currentDocId, isNaN: isNaN(currentDocId) });
            setError(errorMsg);
            return;
        }

        // バリデーション通過時はエラーをクリア
        setError(null);
    }, [spaceId, docId, currentSpaceId, currentDocId, isValidDocId]);

    // === スペース情報取得 ===
    useEffect(() => {
        const fetchSpaceData = async () => {
            if (!currentSpaceId || isNaN(currentSpaceId)) return;

            try {
                const response = await fetch(`/api/spaces/${currentSpaceId}`);
                const data = await response.json();

                if (data.success) {
                    setSpaceData(data.space);
                } else {
                    throw new Error(data.error || 'スペース情報の取得に失敗しました');
                }
            } catch (error) {
                console.error('スペース情報取得中にエラーが発生しました:', error);
                setError(error.message);
            }
        };

        fetchSpaceData();
    }, [currentSpaceId]);

    // === API通信: スペース別投稿データ取得 ===
    const fetchPostsFromAPI = async () => {
        /* 責務: 指定されたスペースの投稿データを取得
         * - 常にスペース別APIエンドポイントを使用
         * - エラー時は適切なエラーメッセージを設定
         * - ローディング状態の管理
         */
        try {
            setIsLoading(true);
            setError(null);

            // 常にスペース別APIエンドポイントを使用
            const response = await fetch(`/api/spaces/${currentSpaceId}/posts`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.posts) {
                setPosts(data.posts);
            } else {
                throw new Error(data.error || '投稿データの取得に失敗しました');
            }

        } catch (err) {
            console.error('useDocumentData: Error fetching posts:', err);
            setError(err.message || 'データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    // === 投稿データ取得 ===
    useEffect(() => {
        fetchPostsFromAPI();
    }, [currentSpaceId, docId]); // スペースIDやドキュメントIDが変わった時も再取得

    // === 返り値 ===
    return {
        // データ
        posts,
        spaceData,

        // URL情報
        currentSpaceId,
        currentDocId,
        spaceId,
        docId,

        // 状態
        isLoading,
        error,
        isValidDocId,

        // アクション
        fetchPostsFromAPI,
        refetch: fetchPostsFromAPI
    };
};