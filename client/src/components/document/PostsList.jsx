import React from 'react';
import PostItem from './PostItem.jsx';

/**
 * 投稿リスト表示コンポーネント
 * 
 * 機能:
 * - 投稿データのソート
 * - 全投稿表示モード
 * - セクション表示モード（将来実装）
 * - 投稿統計の表示
 */
const PostsList = ({ posts, docId, spaceId }) => {
    const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);

    if (docId === 0) {
        return <AllPostsView posts={sortedPosts} />;
    } else {
        return <SectionView posts={sortedPosts} docId={docId} spaceId={spaceId} />;
    }
};

/**
 * 全投稿表示ビュー（docId = 0）
 */
const AllPostsView = ({ posts }) => {
    return (
        <div>
            {/* 投稿統計ヘッダー */}
            <PostsStatistics posts={posts} />
            
            {/* 投稿スタイル定義 */}
            <PostsStyles />
            
            {/* 投稿リスト */}
            <div className="space-y-2">
                {posts.map((post, index) => (
                    <PostItem 
                        key={post.id || index} 
                        post={post} 
                        index={index} 
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * セクション表示ビュー（docId > 0）- 将来実装
 */
const SectionView = ({ posts, docId, spaceId }) => {
    return (
        <div>
            {/* 統計情報 */}
            <div className="mb-8 p-5 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                <h3 className="text-gray-600 font-medium mb-2">
                    📑 セクション {docId} - 開発準備中
                </h3>
                <p className="text-sm text-gray-500">
                    <strong>投稿総数:</strong> {posts.length}件 | 
                    <strong>実装予定:</strong> 見出しレベル別表示
                </p>
            </div>

            {/* 開発中メッセージ */}
            <div className="text-center py-12 text-gray-500">
                <h2 className="text-2xl mb-4">🚧 機能開発中</h2>
                <p className="mb-5">見出しレベル別の表示機能を実装中です</p>
                
                <div className="max-w-md mx-auto mb-5 p-4 bg-gray-50 rounded-md text-left">
                    <h4 className="font-medium text-gray-600 mb-2">実装予定機能:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-5 list-disc">
                        <li>見出し（#）による自動セクション分割</li>
                        <li>階層的なナビゲーション</li>
                        <li>セクション間のリンク機能</li>
                        <li>投稿内容のフィルタリング</li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.href = `/document/${spaceId}/0`}
                    className="
                        px-6 py-3 bg-gray-500 text-white rounded-md
                        hover:bg-gray-600 transition-colors duration-200
                        text-sm font-medium
                    "
                >
                    📄 全投稿を表示
                </button>
            </div>
        </div>
    );
};

/**
 * 投稿統計情報
 */
const PostsStatistics = ({ posts }) => {
    return (
        <div className="mb-8 p-5 bg-gray-50 rounded-lg border-l-4 border-gray-400">
            <h3 className="text-gray-600 font-medium mb-2">📊 全投稿データ</h3>
            <p className="text-sm text-gray-500">
                <strong>総件数:</strong> {posts.length}件 | 
                <strong>生成日時:</strong> {new Date().toLocaleString('ja-JP')}
            </p>
        </div>
    );
};

/**
 * CSS スタイル定義（必要に応じてTailwindで再現困難な部分）
 */
const PostsStyles = () => {
    return (
        <style jsx>{`
            /* 追加のカスタムスタイルが必要な場合はここに定義 */
        `}</style>
    );
};

export default PostsList;