// File: my-react-app/src/TableOfContents.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from './store/postStore';
import useAppStore from './store/appStore';
import './Toc.css';

const TableOfContents = ({ isOpen, onToggle }) => {
    const posts = usePostStore((state) => state.posts);
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);

    // 目次データを生成
    const tocData = useMemo(() => {
        const result = [];
        let currentSection = null;

        // displayOrder順でソート
        const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);

        sortedPosts.forEach(post => {
            // 見出しの場合、新しいセクションを開始
            if (post.msg && post.msg.trim().startsWith('#')) {
                currentSection = {
                    ...post,
                    comments: []
                };
                result.push(currentSection);
            } 
            // 注目のコメント（リアクション数が10以上）の場合、現在のセクションに追加
            else if ((post.positive + post.negative) >= 10 && post.msg && post.msg.trim() !== '') {
                if (currentSection) {
                    currentSection.comments.push(post);
                } else {
                    // 見出しがない場合は、最初のセクションとして追加
                    result.push({
                        id: `section-${post.id}`,
                        msg: '# その他の注目コメント',
                        displayOrder: post.displayOrder,
                        positive: 0,
                        negative: 0,
                        comments: [post]
                    });
                }
            }
        });

        return result;
    }, [posts]);

    const handleItemClick = (postId) => {
        // 後で実装予定：該当の投稿位置にスクロール
        console.log('TOC item clicked:', postId);
    };

    if (!isOpen) {
        return (
            <div className="toc-tab-closed" onClick={onToggle}>
                <div className="toc-tab-text">
                    目次
                </div>
            </div>
        );
    }

    return (
        <div className="toc-panel">
            {/* ヘッダー */}
            <div className="toc-header">
                <h3 className="toc-title">
                    📚 目次
                </h3>
                <button
                    onClick={onToggle}
                    className="toc-close-button"
                >
                    ×
                </button>
            </div>

            {/* コンテンツ */}
            <div className="toc-content">
                {tocData.length === 0 ? (
                    <div className="toc-empty-message">
                        見出しや注目コメントがありません
                    </div>
                ) : (
                    <ul className="toc-list">
                        {tocData.map(section => (
                            <li key={section.id} className="toc-section">
                                {/* 見出し */}
                                <button
                                    onClick={() => handleItemClick(section.id)}
                                    className={`toc-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                >
                                    <span className="toc-heading-icon">#</span>
                                    <span className="toc-heading-text">
                                        {section.msg.replace(/^#+\s*/, '')}
                                    </span>
                                </button>

                                {/* ネストされた注目コメント */}
                                {section.comments.length > 0 && (
                                    <ul className={`toc-comments-list ${isColorfulMode ? 'colorful-mode' : ''}`}>
                                        {section.comments.map(comment => (
                                            <li key={comment.id} className="toc-comment-item">
                                                <button
                                                    onClick={() => handleItemClick(comment.id)}
                                                    className="toc-comment-button"
                                                >
                                                    <div className="toc-comment-text">
                                                        {comment.msg}
                                                    </div>
                                                    <div className="toc-comment-reactions">
                                                        <span className={`toc-reaction-positive ${isColorfulMode ? 'colorful-mode' : ''}`}>
                                                            ⬆ {comment.positive}
                                                        </span>
                                                        <span className={`toc-reaction-negative ${isColorfulMode ? 'colorful-mode' : ''}`}>
                                                            ⬇ {comment.negative}
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TableOfContents;
