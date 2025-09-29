import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

/**
 * 終了したスペースのログ閲覧ページ
 * DocumentPageと同じ構成だが、終了済みスペース専用
 */
const SpaceLogPage = () => {
    const { spaceId } = useParams(); // 終了したスペースのID
    const currentSpaceId = parseInt(spaceId, 10);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceData, setSpaceData] = useState(null);

    // スペース情報を取得（終了済みスペース用）
    useEffect(() => {
        const fetchSpaceData = async () => {
            if (!currentSpaceId || isNaN(currentSpaceId)) return;

            try {
                // 終了済みスペースの情報を取得
                const response = await fetch(`/api/spaces/${currentSpaceId}`);
                const data = await response.json();
                
                if (data.success) {
                    setSpaceData(data.space);
                } else {
                    throw new Error(data.error || 'スペース情報の取得に失敗しました');
                }
            } catch (error) {
                console.error('終了済みスペース情報取得中にエラーが発生しました:', error);
                setError(error.message);
            }
        };

        fetchSpaceData();
    }, [currentSpaceId]);

    // 終了済みスペースの投稿データを取得
    const fetchPostsFromAPI = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // 終了済みスペースのAPIエンドポイントから投稿を取得
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
            console.error('SpaceLogPage: Error fetching posts:', err);
            setError(err.message || 'データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    // コンポーネントマウント時にデータを取得
    useEffect(() => {
        fetchPostsFromAPI();
    }, [currentSpaceId]);

    // ドキュメント生成 (DocumentPageと同じロジック)
    const generateDocumentContent = () => {
        if (isLoading) {
            return `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>📖 ログデータを読み込み中...</h2>
                    <p>終了したスペースの投稿データを取得しています。</p>
                </div>
            `;
        }

        if (error) {
            return `
                <div style="text-align: center; padding: 50px; color: #e74c3c;">
                    <h2>❌ エラーが発生しました</h2>
                    <p>${error}</p>
                    <button onclick="window.location.reload()" style="
                        padding: 10px 20px; 
                        background: #007acc; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        margin-top: 15px;
                    ">
                        再読み込み
                    </button>
                </div>
            `;
        }

        if (!posts || posts.length === 0) {
            return `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>📝 投稿データが見つかりません</h2>
                    <p>このスペースには投稿がありませんでした。</p>
                </div>
            `;
        }

        const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);
        
        let content = `
            <div style="margin-bottom: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">📊 終了済みスペース - 投稿ログ</h3>
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>総件数:</strong> ${posts.length}件 | 
                    <strong>閲覧日時:</strong> ${new Date().toLocaleString('ja-JP')}
                    ${spaceData?.finishedAt ? ` | <strong>終了日時:</strong> ${new Date(spaceData.finishedAt).toLocaleString('ja-JP')}` : ''}
                </p>
            </div>
            <style>
                .post-item {
                    margin: 8px 0;
                    padding: 12px 16px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    cursor: default;
                    position: relative;
                    border-left: 3px solid transparent;
                }
                
                .post-item:hover {
                    transform: translateX(2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .post-item:hover .post-meta {
                    opacity: 1;
                    visibility: visible;
                }
                
                .post-meta {
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease;
                    pointer-events: none;
                    z-index: 10;
                }
                
                .post-content {
                    line-height: 1.5;
                    color: #333;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    margin-right: 60px;
                }
                
                .archived-post {
                    opacity: 0.9;
                    background: #f8f9fa !important;
                }
            </style>
        `;

        sortedPosts.forEach((post, index) => {
            const isHeading = post.msg && post.msg.trim().startsWith('#');
            const positive = post.positive || 0;
            const negative = post.negative || 0;
            const reactionTotal = positive + negative;
            const reactionScore = positive - negative;
            
            // 見出しの場合
            if (isHeading) {
                const headingLevel = (post.msg.match(/^#+/) || ['#'])[0].length;
                const headingText = post.msg.replace(/^#+\s*/, '');
                
                content += `
                    <h${Math.min(headingLevel, 6)} style="
                        color: #2c3e50; 
                        margin: 30px 0 15px 0; 
                        padding: 12px 16px; 
                        background: linear-gradient(90deg, #95a5a6, #7f8c8d);
                        color: white;
                        border-radius: 6px;
                        font-weight: 500;
                    ">
                        ${headingText}
                    </h${Math.min(headingLevel, 6)}>
                `;
            } else {
                // 背景色を反応に基づいて決定（アーカイブ版は少し淡く）
                let backgroundColor = '#ffffff';
                let borderColor = '#e9ecef';
                
                if (reactionTotal > 0) {
                    if (reactionScore > 0) {
                        const intensity = Math.min(reactionScore * 0.08, 0.25);
                        backgroundColor = `rgba(76, 175, 80, ${intensity})`;
                        borderColor = '#4caf50';
                    } else if (reactionScore < 0) {
                        const intensity = Math.min(Math.abs(reactionScore) * 0.08, 0.25);
                        backgroundColor = `rgba(244, 67, 54, ${intensity})`;
                        borderColor = '#f44336';
                    } else {
                        backgroundColor = 'rgba(255, 193, 7, 0.15)';
                        borderColor = '#ffc107';
                    }
                }
                
                if (reactionTotal >= 10) {
                    borderColor = '#ff9800';
                }
                
                content += `
                    <div class="post-item archived-post" style="
                        background: ${backgroundColor};
                        border-left-color: ${borderColor};
                        ${reactionTotal >= 5 ? 'border-left-width: 4px;' : ''}
                    ">
                        <div class="post-meta">
                            👤 ${post.nickname || 'Unknown'}<br>
                            ⏰ ${post.createdAt ? new Date(post.createdAt).toLocaleString('ja-JP') : '時刻不明'}<br>
                            ${reactionTotal > 0 ? `👍${positive} 👎${negative}` : ''}
                        </div>
                        <div class="post-content">${post.msg || '(空のメッセージ)'}</div>
                    </div>
                `;
            }
        });

        return content;
    };

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif',
            margin: '0',
            padding: '0',
            background: '#f5f5f5',
            minHeight: '100vh'
        }}>
            <div style={{
                background: 'white',
                margin: '20px auto',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                maxWidth: '900px',
                minHeight: 'calc(100vh - 40px)',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '15px',
                    marginBottom: '25px',
                    position: 'sticky',
                    top: '0',
                    background: 'white',
                    zIndex: '10'
                }}>
                    <div>
                        <div style={{
                            background: '#fff3cd',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#856404',
                            borderLeft: '4px solid #ffc107',
                            marginBottom: '8px'
                        }}>
                            📄 {spaceData ? `${spaceData.name} (ID: ${currentSpaceId})` : `スペース ${currentSpaceId}`} - 終了済みログ
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginLeft: '16px'
                        }}>
                            {isLoading ? '読み込み中...' : `${posts.length}件の投稿`}
                            {spaceData?.finishedAt && ` | 終了日時: ${new Date(spaceData.finishedAt).toLocaleString('ja-JP')}`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {!isLoading && (
                            <button
                                onClick={fetchPostsFromAPI}
                                style={{
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 15px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#5a6268';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#6c757d';
                                }}
                            >
                                🔄 再読み込み
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    window.close();
                                }
                            }}
                            style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#c82333';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#dc3545';
                            }}
                        >
                            ✕ 閉じる
                        </button>
                    </div>
                </div>
                <div style={{
                    lineHeight: '1.6',
                    color: '#333'
                }}>
                    <div dangerouslySetInnerHTML={{ __html: generateDocumentContent() }} />
                </div>
            </div>
        </div>
    );
};

export default SpaceLogPage;