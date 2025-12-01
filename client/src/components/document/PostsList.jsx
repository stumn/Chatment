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
        <div className="text-left">

            {/* 投稿スタイル定義 */}
            <PostsStyles />

            {/* 投稿リスト */}
            <div className="space-y-0.5">
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
        <div className="text-left">
            {/* 統計情報 */}
            <div className="mb-1 px-2 py-0.5 bg-gray-50 rounded border-l-2 border-gray-400">
                <div className="text-xs text-gray-600">
                    📑 セクション {docId} - 開発準備中 | {posts.length}件
                </div>
            </div>

            {/* 開発中メッセージ */}
            <div className="py-3 text-gray-500">
                <div className="text-sm mb-2 font-medium">🚧 機能開発中</div>
                <p className="text-xs mb-3">見出しレベル別の表示機能を実装中です</p>

                <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium text-gray-600 mb-1">実装予定機能:</div>
                    <ul className="text-gray-600 space-y-0.5 ml-4 list-disc">
                        <li>見出し（#）による自動セクション分割</li>
                        <li>階層的なナビゲーション</li>
                        <li>セクション間のリンク機能</li>
                        <li>投稿内容のフィルタリング</li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.href = `/document/${spaceId}/0`}
                    className="
                        px-3 py-1 bg-gray-500 text-white rounded
                        hover:bg-gray-600 transition-colors
                        text-xs
                    "
                >
                    📄 全投稿を表示
                </button>
            </div>
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