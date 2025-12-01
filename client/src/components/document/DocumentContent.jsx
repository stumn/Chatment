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

    // 正常時:PostsListコンポーネントを使用
    return (
        <div className="px-3 pb-2 pt-[21px] text-left">
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
        <div className="px-3 py-8 text-gray-500">
            <div className="text-sm">📖 データを読み込み中...</div>
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
            <div className="px-8 py-12">
                <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded p-6">
                    <div className="text-red-700 text-lg font-medium mb-4">⚠️ URLパラメータエラー</div>
                    <pre className="bg-white p-4 rounded text-sm text-gray-700 whitespace-pre-wrap mb-6 border border-gray-200">
                        {error}
                    </pre>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => window.location.href = `/document/${currentSpaceId}/0`}
                            className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                        >
                            📄 全投稿を表示
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                        >
                            ← 戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // その他のエラー（API通信エラーなど）
    return (
        <div className="px-3 py-4">
            <div className="text-red-600 text-sm mb-1">❌ エラーが発生しました</div>
            <p className="text-xs text-gray-600 whitespace-pre-wrap mb-3">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
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
        <div className="px-3 py-8 text-gray-500">
            <div className="text-sm mb-1">📝 投稿データが見つかりません</div>
            <div className="text-xs">チャットでメッセージを投稿すると、ここにドキュメントとして表示されます。</div>
        </div>
    );
};

export default DocumentContent;