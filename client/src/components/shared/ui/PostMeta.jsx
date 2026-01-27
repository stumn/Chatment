import React from 'react';

/**
 * 投稿メタ情報（ホバー時表示）
 * 
 * 投稿者の名前と投稿日時を表示する共通コンポーネント
 * ホバー時に投稿の左側に表示される
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

export default PostMeta;
