// File: my-react-app/src/TableOfContents.jsx

import React, { useState, useMemo } from 'react';
import usePostStore from './store/postStore';
import useAppStore from './store/appStore';

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
            <div style={{
                position: 'fixed',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '0 8px 8px 0',
                padding: '8px 4px',
                cursor: 'pointer',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
            }} onClick={onToggle}>
                <div style={{ writingMode: 'vertical-rl', fontSize: '14px', color: '#666' }}>
                    目次
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '280px',
            height: '100vh',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #e0e0e0',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}>
            {/* ヘッダー */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    📚 目次
                </h3>
                <button
                    onClick={onToggle}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '4px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* コンテンツ */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px'
            }}>
                {tocData.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '14px',
                        marginTop: '40px'
                    }}>
                        見出しや注目コメントがありません
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {tocData.map(section => (
                            <li key={section.id} style={{ marginBottom: '16px' }}>
                                {/* 見出し */}
                                <button
                                    onClick={() => handleItemClick(section.id)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid transparent',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: isColorfulMode ? '#6D28D9' : '#333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.2s',
                                        ':hover': {
                                            backgroundColor: isColorfulMode ? 'rgba(109, 40, 217, 0.1)' : '#f0f0f0'
                                        }
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = isColorfulMode ? 'rgba(109, 40, 217, 0.1)' : '#f0f0f0';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span style={{ marginRight: '8px' }}>#</span>
                                    <span style={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {section.msg.replace(/^#+\s*/, '')}
                                    </span>
                                </button>

                                {/* ネストされた注目コメント */}
                                {section.comments.length > 0 && (
                                    <ul style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: '8px 0 0 20px',
                                        borderLeft: `2px solid ${isColorfulMode ? 'rgba(109, 40, 217, 0.3)' : '#ddd'}`,
                                        paddingLeft: '12px'
                                    }}>
                                        {section.comments.map(comment => (
                                            <li key={comment.id} style={{ marginBottom: '8px' }}>
                                                <button
                                                    onClick={() => handleItemClick(comment.id)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '6px 8px',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid transparent',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        color: '#555',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#f0f0f0';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <div style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {comment.msg}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontSize: '11px',
                                                        color: '#999'
                                                    }}>
                                                        <span style={{ color: isColorfulMode ? '#10B981' : '#999', marginRight: '8px' }}>
                                                            ⬆ {comment.positive}
                                                        </span>
                                                        <span style={{ color: isColorfulMode ? '#EF4444' : '#999' }}>
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
