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
    const positive = post.positive || 0;
    const negative = post.negative || 0;
    const reactionTotal = positive + negative;
    const reactionScore = positive - negative;

    // 見出し投稿の場合
    if (isHeading) {
        return <HeadingPost post={post} />;
    }

    // 通常投稿の場合
    return <RegularPost post={post} reactionScore={reactionScore} reactionTotal={reactionTotal} />;
};

/**
 * 見出し投稿コンポーネント
 */
const HeadingPost = ({ post }) => {
    const headingLevel = (post.msg.match(/^#+/) || ['#'])[0].length;
    const headingText = post.msg.replace(/^#+\s*/, '');
    const HeadingTag = `h${Math.min(headingLevel, 6)}`;

    return React.createElement(
        HeadingTag,
        {
            className: `
                text-white font-medium my-1 px-2 py-0.5 text-xs rounded text-left
                bg-gradient-to-r from-blue-500 to-blue-600
            `,
            style: { fontSize: '0.75rem' }
        },
        headingText
    );
};

/**
 * 通常投稿コンポーネント
 */
const RegularPost = ({ post, reactionScore, reactionTotal }) => {
    // リアクションに基づく背景色とボーダー色を決定
    const getPostStyles = () => {
        let bgColor = 'bg-white';
        let borderColor = 'border-gray-200';
        let borderWidth = 'border-l-3';

        if (reactionTotal > 0) {
            if (reactionScore > 0) {
                // ポジティブな反応が多い
                const intensity = Math.min(reactionScore * 10, 30);
                bgColor = `bg-green-50`;
                borderColor = 'border-green-400';
            } else if (reactionScore < 0) {
                // ネガティブな反応が多い
                bgColor = `bg-red-50`;
                borderColor = 'border-red-400';
            } else {
                // 同じ数の反応
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-400';
            }
        }

        // 特に注目度が高い投稿（リアクション10以上）
        if (reactionTotal >= 10) {
            borderColor = 'border-orange-400';
        }

        // 非常に注目度が高い投稿（リアクション5以上）はボーダーを太く
        if (reactionTotal >= 5) {
            borderWidth = 'border-l-4';
        }

        return `${bgColor} ${borderColor} ${borderWidth}`;
    };

    return (
        <div className={`
            group relative my-0.5 px-2 py-0.5 rounded border-l-2 
            transition-all duration-150 ease-in-out cursor-default
            hover:translate-x-1
            ${getPostStyles()}
        `}>
            {/* ホバー時のメタ情報 */}
            <PostMeta post={post} reactionTotal={reactionTotal} />

            {/* 投稿内容 */}
            <PostContent post={post} />
        </div>
    );
};

/**
 * 投稿メタ情報（ホバー時表示）
 */
const PostMeta = ({ post, reactionTotal }) => {
    const positive = post.positive || 0;
    const negative = post.negative || 0;

    return (
        <div className="
            absolute top-1 right-2 z-10
            bg-black/80 text-white text-xs px-1.5 py-0.5 rounded
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-150 pointer-events-none
        ">
            <div>👤 {post.nickname || 'Unknown'}</div>
            <div>⏰ {post.createdAt ? new Date(post.createdAt).toLocaleString('ja-JP') : '時刻不明'}</div>
            {reactionTotal > 0 && (
                <div>👍{positive} 👎{negative}</div>
            )}
        </div>
    );
};

/**
 * 投稿内容表示
 */
const PostContent = ({ post }) => {
    return (
        <div className="
            text-gray-800 text-sm leading-snug whitespace-pre-wrap break-words
            mr-12
        ">
            {post.msg || '(空のメッセージ)'}
        </div>
    );
};

export default PostItem;