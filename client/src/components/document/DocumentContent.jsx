import React from 'react';
import PostsList from './PostsList.jsx';

/**
 * ドキュメントコンテンツ表示コンポーネント
 * 
 * 機能:
 * - 状態別の表示制御（ローディング、エラー、空データ、正常表示）
 * - URLパラメータエラーの専用UI
 * - API通信エラーの表示
 * - 正常時のPostsList表示
 */
const DocumentContent = ({
    posts,
    isLoading,
    error,
    isValidDocId,
    currentDocId,
    currentSpaceId
}) => {
    // バリデーションエラー時は何も表示しない
    if (!isValidDocId) {
        return null;
    }

    // ローディング時
    if (isLoading) {
        return <LoadingView />;
    }

    // エラー時
    if (error) {
        return <ErrorView error={error} currentSpaceId={currentSpaceId} />;
    }

    // データが空の時
    if (!posts || posts.length === 0) {
        return <EmptyDataView />;
    }

    // 正常時：PostsListコンポーネントを使用
    return (
        <div className="leading-relaxed text-gray-800">
            <PostsList
                posts={posts}
                docId={currentDocId}
                spaceId={currentSpaceId}
            />
        </div>
    );
};

/**
 * ローディング表示コンポーネント
 */
const LoadingView = () => {
    return (
        <div className="text-center py-12 text-gray-500">
            <h2 className="text-2xl mb-4">📖 データを読み込み中...</h2>
            <p>サーバーからpostsデータを取得しています。</p>
        </div>
    );
};

/**
 * エラー表示コンポーネント
 */
const ErrorView = ({ error, currentSpaceId }) => {
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
};

/**
 * 空データ表示コンポーネント
 */
const EmptyDataView = () => {
    return (
        <div className="text-center py-12 text-gray-500">
            <h2 className="text-2xl mb-4">📝 投稿データが見つかりません</h2>
            <p>チャットでメッセージを投稿すると、ここにドキュメントとして表示されます。</p>
        </div>
    );
};

export default DocumentContent;