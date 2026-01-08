import React from 'react';

/**
 * 1つの投稿を表示するコンポーネント
 * 
 * 機能:
 * - 見出し投稿の特別表示
 * - リアクションに基づく色分け
 * - ホバー時のメタ情報表示
 * - 投稿内容の適切なレンダリング
 */
const PostItem = ({ post, index }) => {
    const isHeading = post.msg && post.msg.trim().startsWith('#');
    const positive = post.positive.length || 0;
    const negative = post.negative.length || 0;
    const diff = positive - negative;

    console.log(positive, negative, diff);

    // 見出し投稿の場合
    if (isHeading) {
        return <HeadingPost post={post} />;
    }

    // 通常投稿の場合
    return <RegularPost post={post} reactionDiff={diff} />;
};

/**
 * 見出し投稿コンポーネント
 */
const HeadingPost = ({ post }) => {
    return (
        <div className="group relative">
            <PostMeta post={post} />
            <div className="text-white font-medium mb-1 px-2 mt-2 py-0.5 text-lg rounded text-left bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ fontSize: '0.75rem' }}>
                {post.msg}
            </div>
        </div >
    );
};

/**
 * 通常投稿コンポーネント
 */
const RegularPost = ({ post, reactionDiff }) => {
    // インデントレベルを取得（0, 1, 2）
    const indentLevel = post.indentLevel || 0;

    // リアクションに基づく背景色スタイル（DocRowと同じ色コード）
    const getReactionStyle = () => {

        if (reactionDiff === 0) {
            // 差がない場合は何もしない
            return {};
        }

        return reactionDiff > 0
            ? { backgroundColor: '#e6ffe6', padding: '2px 4px', borderRadius: '4px' }
            : { backgroundColor: '#ffe6e6', padding: '2px 4px', borderRadius: '4px' };
    };

    return (
        <div className="group relative my-0.5 rounded transition-all duration-150 ease-in-out cursor-default"
            style={getReactionStyle()}>
            <PostMeta post={post} />
            <div className="text-gray-800 text-sm leading-snug whitespace-pre-wrap break-words mr-12"
                style={{ paddingLeft: `${indentLevel * 1}em` }}>
                <span className="text-gray-400">・</span>{post.msg || '(空のメッセージ)'}
            </div>
        </div>
    );
};

/**
 * 投稿メタ情報（ホバー時表示）
 */
const PostMeta = ({ post }) => {
    return (
        <div className="
            absolute top-1 right-full mr-2 z-10
            bg-black/80 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-150 pointer-events-none
        ">
            <div>{post.nickname || 'Unknown'}さん</div>
            <div>{post.createdAt ? new Date(post.createdAt).toLocaleString('ja-JP') : '時刻不明'}</div>
        </div>
    );
};

export default PostItem;