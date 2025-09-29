import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostsList from '../../components/document/PostsList.jsx';

/**
 * 統一ドキュメント表示ページ
 * 
 * 設計思想:
 * - アクティブスペース/終了スペース両方に対応
 * - docIdによる表示内容の分岐
 *   - docId = 0: 全投稿表示
 *   - docId > 0: 見出しレベル別表示（将来実装）
 * 
 * URL形式: /document/:spaceId/:docId
 * アクセス経路:
 * - チャット内ドキュメントリスト → 詳細分割表示用
 * - 管理画面終了スペース → 全投稿ログ閲覧用
 */
const DocumentPage = () => {
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
    // 将来拡張: docIdの上限チェック、特定値の予約など

    // === URLパラメータバリデーション ===
    useEffect(() => {
        console.log('[DocumentPage] URL Parameters:', {
            spaceId: spaceId,
            docId: docId,
            parsedSpaceId: currentSpaceId,
            parsedDocId: currentDocId
        });

        // spaceIdのバリデーション
        if (!currentSpaceId || isNaN(currentSpaceId)) {
            const errorMsg = `🚫 無効なスペースID: "${spaceId}"\n\n` +
                `正の整数を指定してください。\n` +
                `例: /document/1/0`;
            console.error('Invalid spaceId:', { provided: spaceId, parsed: currentSpaceId });
            setError(errorMsg);
            return;
        }

        // docIdのバリデーション  
        if (!isValidDocId) {
            let errorMsg = `🚫 無効なドキュメントID: "${docId}"\n\n`;

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
            console.error('DocumentPage: Error fetching posts:', err);
            setError(err.message || 'データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    // === 投稿データ取得 ===
    useEffect(() => {
        fetchPostsFromAPI();
    }, [currentSpaceId, docId]); // スペースIDやドキュメントIDが変わった時も再取得

    // JSXコンポーネントでの表示内容を生成
    const renderJSXContent = () => {
        // バリデーションエラー時
        if (!isValidDocId) {
            return null;
        }

        // ローディング時
        if (isLoading) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <h2 className="text-2xl mb-4">📖 データを読み込み中...</h2>
                    <p>サーバーからpostsデータを取得しています。</p>
                </div>
            );
        }

        // エラー時
        if (error) {
            // URLパラメータエラーの場合は専用UI
            if (error.includes('無効なスペースID') || error.includes('無効なドキュメントID')) {
                return (
                    <div className="max-w-2xl mx-auto my-12 p-8 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                        <h2 className="text-red-700 text-xl font-medium mb-5">⚠️ URLパラメータエラー</h2>
                        <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap text-left mb-6">
                            {error}
                        </pre>
                        <div className="space-x-3">
                            <button
                                onClick={() => window.location.href = `/document/${currentSpaceId}/0`}
                                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                                📄 全投稿を表示
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                                ← 戻る
                            </button>
                        </div>
                    </div>
                );
            }

            // その他のエラー（API通信エラーなど）
            return (
                <div className="text-center py-12 text-red-600">
                    <h2 className="text-2xl mb-4">❌ エラーが発生しました</h2>
                    <p className="whitespace-pre-wrap mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        再読み込み
                    </button>
                </div>
            );
        }

        // データが空の時
        if (!posts || posts.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <h2 className="text-2xl mb-4">📝 投稿データが見つかりません</h2>
                    <p>チャットでメッセージを投稿すると、ここにドキュメントとして表示されます。</p>
                </div>
            );
        }

        // 正常時：PostsListコンポーネントを使用
        return (
            <PostsList
                posts={posts}
                docId={currentDocId}
                spaceId={currentSpaceId}
            />
        );
    };

    return (
        <div className="font-sans bg-white mx-auto p-8 rounded-xl shadow-2xl max-w-4xl min-h-screen my-8">
            <div id="document-header" className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6 sticky top-0 bg-white z-10">
                <div id='document-info'>
                    <div id="document-title" className="bg-gray-50 px-4 py-3 rounded-md text-sm text-gray-600 border-l-4 border-gray-500 mb-2">
                        📄 {spaceData ? `${spaceData.name} (ID: ${currentSpaceId})` : `スペース ${currentSpaceId}`}
                    </div>
                    <div id="document-meta" className="text-xs text-gray-500 ml-4">
                        {isLoading ? '読み込み中...' : `${posts.length}件の投稿`}
                        {/* 最終投稿日時の表示（アクティブ/終了済み共通） */}
                        {spaceData?.lastActivity && ` | 最終投稿: ${new Date(spaceData.lastActivity).toLocaleString('ja-JP')}`}
                        {/* 終了済みスペースの場合は終了日時も表示 */}
                        {spaceData?.finishedAt && ` | 終了日時: ${new Date(spaceData.finishedAt).toLocaleString('ja-JP')}`}
                        {/* セクション表示（docId > 0の場合） */}
                        {docId && parseInt(docId) > 0 && ` | セクション: ${docId}`}
                    </div>
                </div>
                <div id="document-actions" className="flex gap-3 items-center">
                    {!isLoading && (
                        <button
                            onClick={fetchPostsFromAPI}
                            className="bg-green-500 hover:bg-green-600 text-white border-none px-4 py-2 rounded-md cursor-pointer text-sm transition-colors duration-200"
                        >
                            🔄 再読み込み
                        </button>
                    )}
                    <button
                        onClick={() => {
                            // 新しいタブを閉じる、またはブラウザの戻る機能を使用
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                window.close();
                            }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white border-none px-4 py-2 rounded-md cursor-pointer text-sm transition-colors duration-200"
                    >
                        ✕ 閉じる
                    </button>
                </div>
            </div>
            <div id="document-content" className="leading-relaxed text-gray-800">
                {renderJSXContent()}
            </div>
        </div>
    );
};

export default DocumentPage;